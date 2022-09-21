const puppeteer = require('puppeteer-extra');
const Visits = require('./db/visits')
const Settings = require('./db/settings');
const moment = require('moment');

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

const startBrowser = async () => {
  // const browser = await puppeteer.launch({
  //   headless: false,
  //   defaultViewport: null,
  //   args: ['--start-maximized']
  // });

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
    headless: true,
    devtools: false,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list'
    ]
  });
  const page = await browser.newPage();
  return { page, browser };
}

const doLogin = async (page, id) => {
  try {
    var username = await Settings.findOne({ type: 'username', account: id });
    var password = await Settings.findOne({ type: 'password', account: id });
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
    await setLoginCredentials(page, '#username', username.sentence, '#password', password.sentence)
    // await page.$eval('#username', el => el.value = username);
    // await page.$eval('#password', el => el.value = password);
    await delay(3000);
    await page.$eval('.button-login', el => el.click());
    await delay(3000);
  } catch (e) {
    console.log('Error in login...', e)
  }
}
const getJobIdFromUrl = (url) => {
  return url.substring(url.lastIndexOf('/') + 1)
}
const defineBudget = (type, budget) => {
  var budgetValue = 0;
  if (budget == 'ワーカーと相談する') {
    if (type == '固定報酬制') {
      budgetValue = 100000
    } else if (type == '時間単価制') {
      budgetValue = 2000
    }
  } else {
    if (type == '固定報酬制') {
      if (budget.indexOf('〜  5,000円') > -1) budgetValue = 4000
      else if (budget.indexOf('5,000円  〜  10,000円') > -1) budgetValue = 8000
      else if (budget.indexOf('10,000円  〜  50,000円') > -1) budgetValue = 40000
      else if (budget.indexOf('50,000円  〜  100,000円') > -1) budgetValue = 80000
      else if (budget.indexOf('100,000円  〜  300,000円') > -1) budgetValue = 260000
      else if (budget.indexOf('300,000円  〜  500,000円') > -1) budgetValue = 450000
      else if (budget.indexOf('500,000円  〜  1,000,000円') > -1) budgetValue = 800000
      else if ((budget.match(/円/g) || []).length == 1) budgetValue = parseFloat(budget.substring(0, budget.length - 1))
      else budgetValue = 200000
    } else if (type == '時間単価制') {
      budgetValue = 3000
    }
  }
  return budgetValue;
}
const sendProp = async (page, jobId, id, bid, force = false) => {
  var link = 'https://crowdworks.jp/proposals/new?job_offer_id=' + jobId;
  console.log(link);
  const visited = await Visits.findOne({ link, account: id });
  // const status = await Settings.findOne({ type: 'status', account: id });
  // if (!force && status.sentence == 'stopped') return;
  if (visited) console.log('Already visited...')
  try {
    if (!visited) {
      await page.goto(link);
      const url = await page.evaluate(() => document.location.href);
      console.log(url)
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
      const budget = conds[1]
      const desc = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.post_block > .description'),
          e => e.innerHTML.trim())
      });
      const budgetValue = defineBudget(type, budget);
      console.log(type, budget, budgetValue);
      var amtEl, bidEl, sendBtn;
      do {
        if (type == '固定報酬制')
          amtEl = await page.waitForSelector(`#amount_dummy_`)
        else
          amtEl = await page.waitForSelector(`#hourly_wage_dummy_`)
        bidEl = await page.waitForSelector('.message-body.message_body_for_reply.cw-form_control')
        sendBtn = await page.waitForSelector('.cw-button.cw-button_highlight.cw-button_lg')
      } while (amtEl == undefined || bidEl == undefined || sendBtn == undefined);
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
      if (type == '固定報酬制')
        await setProposalValues(page, `#amount_dummy_`, budgetValue.toString(),
          `.message-body.message_body_for_reply.cw-form_control`, bid);
      else
        await setProposalValues(page, `#hourly_wage_dummy_`, budgetValue.toString(),
          `.message-body.message_body_for_reply.cw-form_control`, bid);
      await delay(2000);
      await page.evaluate(() => {
        const div = document.querySelector('.cw-form_horizontal.proposal');
        div.click();
      });
      await delay(2000);
      await sendBtn.click();
      await delay(2000);
      await Visits.create({ link, time: Date.now(), account: id });
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
    console.log(`Doing ${type} bid...\n${data.length} links fetched...`)
    var cnt = data.length;
    const bid = await Settings.findOne({ type, account: id });

    for (var jobId of data) {
      console.log(`${cnt} links remained...`);
      await sendProp(page, jobId, id, bid.sentence);
      cnt--;
    }
  } catch (e) {
    console.log(e)
  }
}

const bot = async (id) => {

  const { page, browser } = await startBrowser();
  await doLogin(page, id);
  for (var type of types) {
    await goJobsPage(page, id, type);
  }
  await browser.close();
}

const doCertain = async (id, url, type) => {

  const { page, browser } = await startBrowser();
  await doLogin(page, id);
  const jobId = getJobIdFromUrl(url)
  const bid = await Settings.findOne({ account: id, type });
  await sendProp(page, jobId, id, bid.sentence, true);
  await browser.close();
}

module.exports = { bot, doCertain }