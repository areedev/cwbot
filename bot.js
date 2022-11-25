const puppeteer = require('puppeteer-extra');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const EventEmitter = require('events');
const moment = require('moment');

const Accounts = require('./db/accounts');
const Contracts = require('./db/contracts');
const BadClients = require('./db/badclients');
const Keywords = require('./db/keywords');
const Visits = require('./db/visits')
const Mails = require('./db/mails');
const Skills = require('./db/skills');
var userAgent = require('user-agents');
const { startImap, closeImap } = require('./controllers/imap');

const eventEmitter = new EventEmitter();
var tag = ''

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      // token: '1f5625b7bce2ba96e85ef0f29409f302', // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
      token: '809b981917c5661aa66fb6caf5cdbf8a' // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

const loginUrl = 'https://crowdworks.jp/login?ref=toppage_hedder'

const registerUrl = 'https://crowdworks.jp/user/new_email?ref=toppage_hedder'
const urls = {
  web: 'https://crowdworks.jp/public/jobs/search?category_id=230&hide_expired=true&keep_search_criteria=true&order=new',
  app: 'https://crowdworks.jp/public/jobs/search?category_id=242&keep_search_criteria=true&order=new&hide_expired=true',
  sys: 'https://crowdworks.jp/public/jobs/search?category_id=226&keep_search_criteria=true&order=new&hide_expired=true',
  ec: 'https://crowdworks.jp/public/jobs/search?category_id=235&keep_search_criteria=true&order=new&hide_expired=true'
};

const types = ['web', 'app', 'sys', 'ec'];

const delay = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  })
}
const startBrowserWithProxy = async (proxy,
  params = {
    defaultViewport: null,
    headless: true,
    devtools: false,
  }, args = [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process'
  ]

  // params = {
  //   headless: false,
  //   defaultViewport: null
  // },
  // args = ['--start-maximized',
  //   '--disable-web-security',
  //   '--disable-features=IsolateOrigins,site-per-process'
  // ]

  , executablePath = ''
) => {

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
    return { res: 'success', err: '' }
  } catch (e) {
    console.log('Error in login...', e)
    return { res: null, err: 'Error in login...' }
  }
}
const doLogin = async (page, id) => {
  var { auth } = await Accounts.findById(id, 'auth')
  return await doLoginWithAuth(page, auth);
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
const goJobsPage = async (page, id, type, pages) => {
  try {
    await page.goto(`${urls[type]}&page=${pages}`, { timeout: 60000 });
    await page.waitForSelector('.jobs_lists.jobs_lists_simple', { timeout: 60000 })
    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.jobs_lists.jobs_lists_simple > li .item_title a[href]'),
        a => a.getAttribute('href').substring(a.getAttribute('href').lastIndexOf('/') + 1))
    });
    const clients = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.jobs_lists.jobs_lists_simple > li .client-information .user-name a[href]'),
        a => a.getAttribute('href').substring(a.getAttribute('href').lastIndexOf('/') + 1))
    });
    console.log(`Doing ${type} bid ${pages} page...\n${data.length} links fetched...`)
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

const bot = async (id, pages) => {

  const { page, browser } = await startBrowser(id);
  await doLogin(page, id);
  for (var type of types) {
    for (let i = 1; i <= pages; i++)
      await goJobsPage(page, id, type, i);
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
const sendSimpleMessage = async (page, contractId, message) => {
  if (message) {
    try {
      var contract = await Contracts.findById(contractId)
      var url = contract.step < 2 ? `https://crowdworks.jp/proposals/${contract.proposalId}` : `https://crowdworks.jp/contracts/${contract.contractId}`
      console.log(url, message)
      await page.goto(url, { timeout: 60000 })

      const setMessage = async (page, selector, value) => {
        await page.waitForSelector(selector);
        await page.click(selector);
        page.keyboard.type(value);
      }
      await delay(1000);
      await setMessage(page, '#pack-message-thread #message_body', message)
      await delay(10000);
      await page.evaluate(() => {
        const div = document.querySelector(".cw-message-thread");
        div.click();
      })
      await delay(2000);
      await page.evaluate(() => { const btn = document.querySelector('.cw-message-form .form-footer button.cw-button.cw-button_action'); btn.click(); })
    }
    catch (e) {
      console.log(e)
    }
  }
}
const cAgreeCond = async (page, contractId, id, message = '') => {
  var contract = await Contracts.findById(contractId)
  const account = await Accounts.findById(id)
  if (contract.step == 0 && account.client) {
    try {
      var url = `https://crowdworks.jp/proposals/${contract.proposalId}`
      await page.goto(url, { timeout: 60000 });
      url = await page.evaluate(() => document.location.href);
      if (url.indexOf('proposals') < 0) return;
      await page.evaluate(() => { const btn = document.querySelector(".actions a.intro-employer_proposed_project"); btn.click(); })
      await delay(1000);
      await page.evaluate(() => { const checkbox = document.querySelector("#check-terms"); checkbox.click(); })
      await page.evaluate(() => { const btn = document.querySelector(".contractual-agreement"); btn.click(); })
      await delay(2000);
      await Contracts.findByIdAndUpdate(contractId, { step: 1 })
      if (message) await sendSimpleMessage(page, contractId, message)
    } catch (e) {
      console.log(e)
    }
  }
}
const wAgreeContract = async (page, contractId, id, message = '') => {
  var contract = await Contracts.findById(contractId)
  const account = await Accounts.findById(id)
  if (contract.step == 1 && !account.client) {
    try {
      var url = `https://crowdworks.jp/proposals/${contract.proposalId}`
      await page.goto(url, { timeout: 60000 });
      url = await page.evaluate(() => document.location.href);
      if (url.indexOf('proposals') < 0) return;
      url = await page.evaluate(() => document.querySelector("a.intro-employer_waiting_contract_project").href);
      await page.goto(url);
      url = await page.evaluate(() => document.location.href);
      if (url.indexOf('contract_requests/new') < 0) return;
      console.log('agreeing')
      await page.evaluate(() => { const btn = document.querySelector(".new_contract_request .action input.cw-button"); btn.click() });
      await delay(1000);
      url = `https://crowdworks.jp/proposals/${contract.proposalId}`
      await page.goto(url);
      url = await page.evaluate(() => document.location.href);
      if (url.indexOf('contracts') < 0) return;
      await Contracts.findByIdAndUpdate(contractId, { step: 2, contractId: url.substring(url.indexOf('contracts') + 10, url.indexOf('contracts') + 18) })
      if (message) await sendSimpleMessage(page, contractId, message)
    } catch (e) {
      console.log(e)
    }
  }
}
const cEscrow = async (page, contractId, id, message = '') => {
  var contract = await Contracts.findById(contractId)
  const account = await Accounts.findById(id)
  if (contract.step == 2 && account.client) {
    try {
      var url = `https://crowdworks.jp/contracts/${contract.contractId}/milestones`
      await page.goto(url, { timeout: 60000 });
      url = await page.evaluate(() => document.location.href);
      if (url.indexOf(`contracts/${contract.contractId}/milestones`) < 0) return;
      // url = await page.evaluate(() => document.querySelector("a.intro-employer_waiting_contract_project").href);
      // await page.goto(url);
      // url = await page.evaluate(() => document.location.href);
      // if (url.indexOf('contract_requests/new') < 0) return;
      // console.log('agreeing')
      await page.evaluate(() => { const btn = document.querySelector('#escrow_id input.cw-button'); btn.click() });
      await delay(2000);
      await page.evaluate(() => { const btn = document.querySelector('.one_click_payment_form input.cw-button'); btn.click() });
      await delay(1000);
      await page.evaluate(() => { const btn = document.querySelector('.ui-dialog-buttonset button:nth-child(1)'); btn.click() });
      await delay(1000);
      url = `https://crowdworks.jp/contracts/${contract.contractId}`
      await page.goto(url);
      // url = await page.evaluate(() => document.location.href);
      // if (url.indexOf('contracts') < 0) return;
      // contract.contractId = url.substring(url.indexOf('contracts') + 10, url.indexOf('contracts') + 18)
      await Contracts.findByIdAndUpdate(contractId, { step: 3 });
      if (message) await sendSimpleMessage(page, contractId, message)
    } catch (e) {
      console.log(e)
    }
  }
}

const wDeliver = async (page, contractId, id, message = '') => {
  if (!message) return;
  var contract = await Contracts.findById(contractId)
  const account = await Accounts.findById(id)
  if (contract.step == 3 && !account.client) {
    var url = `https://crowdworks.jp/contracts/${contract.contractId}`
    await page.goto(url, { timeout: 60000 });
    url = await page.evaluate(() => document.location.href);
    if (url.indexOf('contracts') < 0) return;
    await page.evaluate(() => { const btn = document.querySelector('.progress .progress_detail .action a.cw-button'); btn.click(); })
    await delay(2000);
    await page.waitForSelector('.ui-dialog .message-dialog .cw-core_enable #message_body');
    await page.evaluate((data) => {
      var textarea = document.querySelector(data.selector);
      textarea.value = data.value;
      const event = new Event('change');
      textarea.dispatchEvent(event);
    }, { selector: '.ui-dialog .message-dialog .cw-core_enable #message_body', value: message })
    await delay(2000);
    await page.evaluate(() => { const btn = document.querySelector('.ui-dialog .message-dialog .cw-core_enable .submit input.cw-button'); btn.click(); })
    await delay(1000);
    await Contracts.findByIdAndUpdate(contractId, { step: 4 });
    // if (message) await sendSimpleMessage(page, contractId, message)
  }
}
const cTest = async (page, contractId, id, message = '') => {
  if (!message) return;
  var contract = await Contracts.findById(contractId)
  const account = await Accounts.findById(id)
  if (contract.step == 4 && account.client) {
    var url = `https://crowdworks.jp/contracts/${contract.contractId}`
    await page.goto(url, { timeout: 60000 });
    url = await page.evaluate(() => document.location.href);
    if (url.indexOf('contracts') < 0) return;
    await page.evaluate(() => { const btn = document.querySelector('.action.intro-employer_acceptance_project a:nth-child(1)'); btn.click(); })
    await delay(2000);
    await page.waitForSelector('.ui-dialog .message-dialog .cw-core_enable #message_body');
    await page.evaluate((data) => {
      var textarea = document.querySelector(data.selector);
      textarea.value = data.value;
      const event = new Event('change');
      textarea.dispatchEvent(event);
    }, { selector: '.ui-dialog .message-dialog .cw-core_enable #message_body', value: message })
    await delay(2000);
    await page.evaluate(() => { const btn = document.querySelector('.ui-dialog .message-dialog .cw-core_enable .submit input.cw-button'); btn.click(); })
    await delay(2000);
    await Contracts.findByIdAndUpdate(contractId, { step: 5 });
    // if (message) await sendSimpleMessage(page, contractId, message)
  }
}
const cReview = async (page, contractId, id, message = '') => {
  if (!message) return;
  var contract = await Contracts.findById(contractId)
  const account = await Accounts.findById(id)
  if (contract.step == 5 && account.client) {
    var url = `https://crowdworks.jp/contracts/${contract.contractId}/feedbacks/new`
    await page.goto(url, { timeout: 60000 });
    url = await page.evaluate(() => document.location.href);
    if (url.indexOf('feedbacks/new') < 0) return;

    await page.evaluate(() => { const btn = document.querySelector('#feedback_skills_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#feedback_quality_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#feedback_deadlines_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#feedback_communication_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#feedback_cooperation_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#real_evaluation_score_10'); btn.click(); })
    await page.waitForSelector('#feedback_comment');
    await page.evaluate((data) => {
      var textarea = document.querySelector(data.selector);
      textarea.value = data.value;
      const event = new Event('change');
      textarea.dispatchEvent(event);
    }, { selector: '#feedback_comment', value: message })
    await page.evaluate(() => { const btn = document.querySelector('.feedback-modal-container button'); btn.click(); })
    await delay(1000);
    await page.evaluate(() => { const btn = document.querySelector('.cw-button.cw-button_action.modal-action-button'); btn.click(); })
    await delay(1000);
    await Contracts.findByIdAndUpdate(contractId, { step: 6 });
    // if (message) await sendSimpleMessage(page, contractId, message)
  }
}
const wReview = async (page, contractId, id, message = '') => {
  if (!message) return;
  var contract = await Contracts.findById(contractId)
  const account = await Accounts.findById(id)
  if (contract.step == 6 && !account.client) {
    var url = `https://crowdworks.jp/contracts/${contract.contractId}/feedbacks/new`
    await page.goto(url, { timeout: 60000 });
    url = await page.evaluate(() => document.location.href);
    if (url.indexOf('feedbacks/new') < 0) return;

    await page.evaluate(() => { const btn = document.querySelector('#feedback_skills_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#feedback_quality_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#feedback_deadlines_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#feedback_communication_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#feedback_cooperation_5'); btn.click(); })
    await page.evaluate(() => { const btn = document.querySelector('#real_evaluation_score_10'); btn.click(); })
    await page.waitForSelector('#feedback_comment');
    await page.evaluate((data) => {
      var textarea = document.querySelector(data.selector);
      textarea.value = data.value;
      const event = new Event('change');
      textarea.dispatchEvent(event);
    }, { selector: '#feedback_comment', value: message })
    await page.evaluate(() => { const btn = document.querySelector('.feedback-modal-container button'); btn.click(); })
    await delay(1000);
    await page.evaluate(() => { const btn = document.querySelector('.cw-button.cw-button_action.modal-action-button'); btn.click(); })
    await delay(1000);
    await Contracts.findByIdAndUpdate(contractId, { step: 7 });
    // if (message) await sendSimpleMessage(page, contractId, message)
  }
}

const contractAction = async (page, contractId, id, message = '') => {
  const contract = await Contracts.findById(contractId)
  const account = await Accounts.findById(id)
  if (account.client && contract.step == 0) await cAgreeCond(page, contractId, id, message)
  if (!account.client && contract.step == 1) await wAgreeContract(page, contractId, id, message)
  if (account.client && contract.step == 2) await cEscrow(page, contractId, id, message)
  if (!account.client && contract.step == 3) await wDeliver(page, contractId, id, message)
  if (account.client && contract.step == 4) await cTest(page, contractId, id, message)
  if (account.client && contract.step == 5) await cReview(page, contractId, id, message)
  if (!account.client && contract.step == 6) await wReview(page, contractId, id, message)
}

const contractActions = async (ids, id, message = '') => {
  const { page, browser } = await startBrowser(id);
  const { res, err } = await doLogin(page, id);
  if (res)
    for (let i = 0; i < ids.length; i++) {
      await contractAction(page, ids[i], id, message)
    }
  await browser.close()
  console.log('Browser closed...')
}
const sendSimpleMessages = async (ids, id, message = '') => {
  const { page, browser } = await startBrowser(id);
  await doLogin(page, id);
  for (let i = 0; i < ids.length; i++) {
    await sendSimpleMessage(page, ids[i], message)
  }
  await browser.close()
  console.log('Browser closed...')
}

const createAcc = async (mail, no) => {
  try {
    const { page, browser } = await startBrowserWithProxy(null)

    await page.goto(registerUrl, { timeout: 60000 })
    await page.waitForSelector('#email_verification_key');
    await page.click('#email_verification_key');
    page.evaluate(async (mail) => {
      var input = document.querySelector('#email_verification_key');
      input.value = mail;
      const event = new Event('change');
      input.dispatchEvent(event);
    }, `${mail.substring(0, mail.indexOf('@'))}+${no}@${mail.substring(mail.indexOf('@') + 1)}`)
    await delay(1000);
    page.evaluate(() => {
      document.querySelector('.button-submit').click();
    });
  } catch (e) {
    console.log('Error in creating acc...', e)
    console.log('Browser closed')
  }
}
const completeRegister = async (payload) => {
  try {
    if (payload.link) {
      const { page, browser } = await startBrowserWithProxy(null)
      console.log(payload.to + ' Email verifying...')
      await page.goto(payload.link, { timeout: 60000 });
      var url = await page.evaluate(() => document.location.href);
      console.log(url);
      var username = '';
      page.on('dialog', async dialog => {
        console.log('Leaving page...');
        await dialog.accept();
        await page.waitForSelector("form input[type='submit']");
        const url = await page.evaluate(() => document.location.href);
        if (url.indexOf('crowdworks.jp/user/preview') < 0) return console.log('Failed to finish register...');
        await page.evaluate(() => { const btn = document.querySelector("form input[type='submit']"); btn.click(); });
        await delay(2000)
        console.log('Updating mail...')
        await Mails.findOneAndUpdate({ user: payload.origin }, { no: payload.no });
        console.log('Creating account data...')
        await Accounts.create({ auth: { username: payload.to, password: 'RootRoot123$' }, tagId: tag, username });
        await browser.close()
        console.log('Browser closed')
        await delay(2000)
        eventEmitter.emit('done', { no: payload.no })
      });
      await page.evaluate(() => {
        document.querySelector('#user_password').value = 'RootRoot123$';
        document.querySelector('#user_password_confirmation').value = 'RootRoot123$';
        document.querySelector('#user_role_employee').click();
        document.querySelector('#user_birthday_1i').value = '1990';
        document.querySelector('#user_birthday_2i').value = '8';
        document.querySelector('#user_birthday_3i').value = '30';

        document.querySelector('#user_profile_attributes_usertype_individual').click();

        document.querySelector('#user_profile_attributes_last_name').value = '石田';
        document.querySelector('#user_profile_attributes_first_name').value = '太郎';
        document.querySelector('#user_profile_attributes_last_name_kana').value = 'いしだ';
        document.querySelector('#user_profile_attributes_first_name_kana').value = 'たろ';
        document.querySelector('#user_profile_attributes_sex_none').click();
        document.querySelector('#user_profile_attributes_zip').value = '1300024';
        document.querySelector('#user_profile_attributes_prefecture_id').value = '13';
        document.querySelector('#user_profile_attributes_address').value = '墨田区菊川';
        document.querySelector('#user_terms_of_service').click();

        document.querySelector("#user_occupation_").value = "engineer";
        document.querySelector("#user_occupation_").dispatchEvent(new Event('change'));
        document.querySelector('#occupation_id_1').click();
        document.querySelector('#occupation_id_4').click();
        document.querySelector('#occupation_id_3').click();
        document.querySelector('#occupation_id_52').click();
        document.querySelector('#occupation_id_53').click();
        document.querySelector('#occupation_id_98').click();
        document.querySelector('#occupation_id_48').click();
        document.querySelector('#occupation_id_99').click();
        document.querySelector('#occupation_id_5').click();
        document.querySelector('#occupation_id_6').click();
        document.querySelector('#occupation_id_49').click();
        document.querySelector('#occupation_id_50').click();
        document.querySelector('#occupation_id_51').click();
        document.querySelector('#occupation_id_15').click();
        document.querySelector('#occupation_id_7').click();

      });
      username = await page.evaluate(() => document.querySelector("#user_username").value);
      await page.solveRecaptchas();
      console.log("Recaptcha solved...")
      await delay(1000)
      await page.evaluate(() => {
        document.querySelector("input[type='submit']").click()
      })
    }
  } catch (e) {
    console.log(e)
  }
}
const startAccAutoCreate = async (id, no, tagId, proxyId) => {
  tag = tagId
  if (!no || no < 1) return
  var mail = await Mails.findById(id)
  eventEmitter.on('imapstarted', (payload) => {
    console.log('Imap started')
    createAcc(mail.user, mail.no + 1)
  })
  eventEmitter.on('newmail', completeRegister)
  eventEmitter.on('done', (payload) => {
    if (payload.no == mail.no + no) {
      closeImap()
      eventEmitter.removeAllListeners()
    } else {
      createAcc(mail.user, payload.no + 1)
    }
  })
  startImap(mail.user, eventEmitter)
}

const addAccSkills = async (skillIds, id) => {
  const { page, browser } = await startBrowser(id);
  await doLogin(page, id);
  await page.goto('https://crowdworks.jp/user_skills', { timeout: 60000 });
  var url = await page.evaluate(() => document.location.href);
  if (url.indexOf(`user_skills`) < 0) return await browser.close();

  var skills = await Skills.find({ _id: { $in: skillIds } })
  for (const skill of skills) {
    console.log(skill)
    await page.evaluate((data) => {
      console.log(data)
      document.querySelector('#user_skill_name').value = data.skill.skill;
      document.querySelector("#user_skill_level").value = "5"
      document.querySelector("#user_skill_years").value = "5"
      const btn = document.querySelector('.cw-button.cw-button_action.submit'); btn.click();
    }, { skill });
    await delay(1000);
  }

  await browser.close();
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
module.exports = { bot, doCertain, delay, contractActions, startLocalAccount, sendSimpleMessages, startAccAutoCreate, addAccSkills }