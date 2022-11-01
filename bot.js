const puppeteer = require('puppeteer-extra');
const Visits = require('./db/visits')
const moment = require('moment');
const Accounts = require('./db/accounts');
const Contracts = require('./db/contracts');
const BadClients = require('./db/badclients');
const Keywords = require('./db/keywords');

const loginUrl = 'https://crowdworks.jp/login?ref=toppage_hedder'

const urls = {
  web: 'https://crowdworks.jp/public/jobs/search?category_id=230&hide_expired=true&keep_search_criteria=true&order=new&page=1',
  app: 'https://crowdworks.jp/public/jobs/search?category_id=242&keep_search_criteria=true&order=new&hide_expired=true&page=1',
  sys: 'https://crowdworks.jp/public/jobs/search?category_id=226&keep_search_criteria=true&order=new&hide_expired=true&page=1',
  ec: 'https://crowdworks.jp/public/jobs/search?category_id=235&keep_search_criteria=true&order=new&hide_expired=true&page=1'
};

const types = ['web', 'app', 'sys', 'ec'];

const delay = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  })
}
const startBrowserWithProxy = async (proxy, params = {
  defaultViewport: null,
  headless: true,
  devtools: false,
}, args = [
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--ignore-certificate-errors',
  '--ignore-certificate-errors-spki-list'
], executablePath = '') => {

  if (proxy) {
    args.push(`--proxy-server=${proxy.type}://${proxy.ip}:${proxy.port}`)
    console.log(`Opening browser using proxy ${proxy.type}://${proxy.ip}:${proxy.port}...`)
  } else {
    console.log(`Opening browser without proxy...`)
  }
  const browser = await puppeteer.launch({ ...params, args, executablePath });
  const page = await browser.newPage();
  if (proxy)
    await page.authenticate({ username: proxy.username, password: proxy.password })
  return { page, browser };
}
const startBrowser = async (id) => {
  const { proxy } = await Accounts.findById(id).populate('proxy');
  return await startBrowserWithProxy(proxy);
}
const doLoginWithAuth = async (page, auth) => {
  try {
    var { username, password } = auth
    if (!username || !password) {
      console.log('Username and password is empty.');
      return;
    }
    const setLoginCredentials = async (page, selector1, value1, selector2, value2) => {
      await page.waitForSelector(selector1);
      await page.click(selector1);
      await page.evaluate((data) => {
        return document.querySelector(data.selector).value = data.value;
      }, { selector: selector1, value: value1 })
      await page.click(selector2);
      await page.evaluate((data) => {
        return document.querySelector(data.selector).value = data.value;
      }, { selector: selector2, value: value2 })
    }
    await page.goto(loginUrl, { timeout: 60000 });
    await page.waitForSelector('#username');
    await setLoginCredentials(page, '#username', username, '#password', password)
    // await page.$eval('#username', el => el.value = username);
    // await page.$eval('#password', el => el.value = password);
    await delay(3000);
    await page.$eval('.button-login', el => el.click());
    await delay(3000);
  } catch (e) {
    console.log('Error in login...', e)
  }
}
const doLogin = async (page, id) => {
  var { auth } = await Accounts.findById(id, 'auth')
  await doLoginWithAuth(page, auth);
}
const getJobIdFromUrl = (url) => {
  return url.substring(url.lastIndexOf('/') + 1)
}
const defineBudget = (type, budget) => {
  budget = budget.trim()
  var budgetValue = 0;
  if (budget == 'ワーカーと相談する') {
    if (type == '固定報酬制') {
      budgetValue = 100000
    } else if (type == '時間単価制') {
      budgetValue = 2000
    }
  } else {
    if (type == '固定報酬制') {
      if (budget.indexOf('〜  5,000円') > -1) /* budgetValue = 4000 */ budgetValue = 0
      else if (budget.indexOf('5,000円  〜  10,000円') > -1) /* budgetValue = 8000 */ budgetValue = 0
      else if (budget.indexOf('10,000円  〜  50,000円') > -1) budgetValue = 40000 /* budgetValue = 0*/
      else if (budget.indexOf('50,000円  〜  100,000円') > -1) budgetValue = 80000
      else if (budget.indexOf('100,000円  〜  300,000円') > -1) budgetValue = 200000
      else if (budget.indexOf('300,000円  〜  500,000円') > -1) budgetValue = 400000
      else if (budget.indexOf('500,000円  〜  1,000,000円') > -1) budgetValue = 750000
      else if (budget == '12円') budgetValue = 12
      else if (budget == '13円') budgetValue = 12
      else if ((budget.match(/円/g) || []).length == 1) {
        budgetValue = parseFloat(budget.substring(0, budget.length - 1).replaceAll(/,/g, '')) / 1.1
        if (budgetValue < 70000) budgetValue = 0
      }
      else budgetValue = 200000
    } else if (type == '時間単価制') {
      budgetValue = 1500
    }
  }
  return budgetValue;
}
const sendProp = async (page, jobId, id, bid, bidtype = 'none', budget = 0, force = false) => {
  var link = 'https://crowdworks.jp/proposals/new?job_offer_id=' + jobId;
  console.log(link);
  const visited = await Visits.findOne({ link, account: id });
  // const status = await Settings.findOne({ type: 'status', account: id });
  // if (!force && status.sentence == 'stopped') return;
  if (visited) console.log('Already visited...')
  try {
    if (!visited) {
      await page.goto(link);
      var url = await page.evaluate(() => document.location.href);
      console.log(url)
      if (url.indexOf('contracts/') > -1) {
        return console.log('Already applied...')
      } else if (url.indexOf('crowdworks.jp/login') > -1) {
        return console.log('Login failed...')
      }
      if (url.indexOf('competition') > -1) {
        await Visits.create({ link, time: Date.now(), account: id });
        return console.log("Competition...");
      } else if (url.indexOf('proposals/') > -1 && url.indexOf('proposals/new?job_offer_id') < 0) {
        await Visits.create({ link, time: Date.now(), account: id });
        return console.log("Already applied...");
      }
      await page.waitForSelector('.job_offer-conditions', { timeout: 60000 })
      const conds = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.job_offer-conditions .condition_body'),
          e => e.innerHTML.trim())
      });
      const type = conds[0]
      const price = conds[1]
      const desc = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.post_block > .description'),
          e => e.innerHTML.trim())
      });
      const title = await page.evaluate(() => document.querySelector('.title_container.title_simple a').innerHTML.trim());
      var clientId = await page.evaluate(() => document.querySelector(".job_offer_extract .header_summary a").href);
      clientId = clientId.substring(clientId.lastIndexOf("employers") + 10, clientId.lastIndexOf("employers") + 17);
      console.log(title, clientId);
      const keywords = await Keywords.find();
      for (const k of keywords) {
        if (title.indexOf(k.keyword) >= 0)
          return console.log(`Skipping because of keword ${k.keyword}`);
      }
      var budgetValue = defineBudget(type, price);
      if (budgetValue == 0) {
        await Visits.create({ link, time: Date.now(), account: id });
        console.log('Skipping because of low budget...')
        return;
      }
      console.log(type, price, budgetValue);
      var amtEl, bidEl, sendBtn, hourlyBtn, fixedBtn;
      do {
        if (type == '固定報酬制')
          amtEl = await page.waitForSelector(`#amount_dummy_`)
        else
          amtEl = await page.waitForSelector(`#hourly_wage_dummy_`)
        bidEl = await page.waitForSelector('.message-body.message_body_for_reply.cw-form_control')
        sendBtn = await page.waitForSelector('.cw-button.cw-button_highlight.cw-button_lg')
        hourlyBtn = await page.waitForSelector('#proposal_conditions_attributes_0_payment_type_hourly')
        fixedBtn = await page.waitForSelector('#proposal_conditions_attributes_0_payment_type_fixed_price')
      } while (amtEl == undefined || bidEl == undefined || sendBtn == undefined || hourlyBtn == undefined || fixedBtn == undefined);
      const setProposalValues = async (page, selector1, value1, selector2, value2) => {
        await page.waitForSelector(selector1);
        await page.click(selector1);
        await page.evaluate((data) => {
          document.querySelector(data.selector).value = data.value
        }, { selector: selector1, value: value1 })
        await page.waitForSelector(selector2);
        await page.evaluate((data) => {
          return document.querySelector(data.selector).value = data.value
        }, { selector: selector2, value: value2 })
      }
      budgetValue = budget ? budget : budgetValue;
      if (bidtype != 'none') {
        if (bidtype == '固定報酬制') {
          fixedBtn.click();
          await setProposalValues(page, `#amount_dummy_`, budgetValue.toString(),
            `.message-body.message_body_for_reply.cw-form_control`, bid);
        } else {
          hourlyBtn.click();
          await setProposalValues(page, `#hourly_wage_dummy_`, budgetValue.toString(),
            `.message-body.message_body_for_reply.cw-form_control`, bid);
        }
      }
      else {
        if (type == '固定報酬制')
          await setProposalValues(page, `#amount_dummy_`, budgetValue.toString(),
            `.message-body.message_body_for_reply.cw-form_control`, bid);
        else
          await setProposalValues(page, `#hourly_wage_dummy_`, budgetValue.toString(),
            `.message-body.message_body_for_reply.cw-form_control`, bid);
      }
      await delay(2000);
      await page.evaluate(() => {
        const div = document.querySelector('.cw-form_horizontal.proposal');
        div.click();
      });
      await delay(2000);
      await sendBtn.click();
      await delay(2000);
      await Visits.create({ link, time: Date.now(), account: id });
      const client = await Accounts.findOne({ cwid: clientId });
      if (client) {
        console.log('Fake client')
        await page.goto(link);
        url = await page.evaluate(() => document.location.href);
        if (url.indexOf('proposals') < 0) return;
        const contract = await Contracts.findOne({ clientCwId: clientId, workerId: id, jobId });
        if (!contract) {
          console.log('Creating contract')
          await Contracts.create({ clientCwId: clientId, clientId: client._id, workerId: id, step: 0, jobId, proposalId: url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('/') + 10) })
        } else {
          console.log('Updating contract')
          await Contracts.findOneAndUpdate({ clientCwId: clientId, workerId: id }, { step: 0, jobId, proposalId: url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('/') + 10) })
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
}
const goJobsPage = async (page, id, type) => {
  try {
    await page.goto(urls[type], { timeout: 60000 });
    await page.waitForSelector('.jobs_lists.jobs_lists_simple', { timeout: 60000 })
    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.jobs_lists.jobs_lists_simple > li .item_title a[href]'),
        a => a.getAttribute('href').substring(a.getAttribute('href').lastIndexOf('/') + 1))
    });
    const clients = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.jobs_lists.jobs_lists_simple > li .client-information .user-name a[href]'),
        a => a.getAttribute('href').substring(a.getAttribute('href').lastIndexOf('/') + 1))
    });
    console.log(`Doing ${type} bid...\n${data.length} links fetched...`)
    var cnt = data.length;
    const { bids } = await Accounts.findById(id, 'bids');
    var badclients = await BadClients.find();
    badclients = badclients.map(e => e.id);
    for (var i = 0; i < cnt; i++) {
      var jobId = data[i]
      var clientId = clients[i]
      console.log(`${cnt - i} links remained...`);
      if (badclients.indexOf(clientId) >= 0) {
        console.log('https://crowdworks.jp/proposals/new?job_offer_id=' + jobId);
        console.log(`Skipping because of bad client...`);
        continue;
      } else {
        await sendProp(page, jobId, id, bids[type]);
      }
    }
  } catch (e) {
    console.log(e)
  }
}

const bot = async (id) => {

  const { page, browser } = await startBrowser(id);
  await doLogin(page, id);
  for (var type of types) {
    await goJobsPage(page, id, type);
  }
  await browser.close();
}

const doCertain = async (id, url, type, bidtype, budget) => {

  const jobId = getJobIdFromUrl(url)
  var link = 'https://crowdworks.jp/proposals/new?job_offer_id=' + jobId;
  const visited = await Visits.findOne({ link, account: id });
  if (visited) console.log('Already visited...');
  const { page, browser } = await startBrowser(id);
  await doLogin(page, id);
  const { bids } = await Accounts.findById(id, 'bids');
  await sendProp(page, jobId, id, bids[type], bidtype, budget, true);
  await browser.close();
  console.log('Browser closed...')
}

const startLocalAccount = async (proxy, auth, chrome) => {
  var params = {
    headless: false,
    defaultViewport: null
  }
  var args = ['--start-maximized']
  var executablePath = chrome ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : ''
  const { page, browser } = await startBrowserWithProxy(proxy, params, args, executablePath);
  doLoginWithAuth(page, auth);
}
module.exports = { bot, doCertain, delay, startLocalAccount }