const puppeteer = require('puppeteer-extra');
const Visits = require('./db/visits')
const Settings = require('./db/settings');
const moment = require('moment');
const c = require('./constants/crowdworks.jp.cookies.json')
const bot = async (id) => {

  const webBid = await Settings.findOne({ type: 'web', account: id })
  const appBid = await Settings.findOne({ type: 'app', account: id })
  const ecBid = await Settings.findOne({ type: 'ec', account: id })
  var cookie = await Settings.findOne({ type: 'json', account: id })
  const webUrl = 'https://crowdworks.jp/public/jobs/search?category_id=230&hide_expired=true&keep_search_criteria=true&order=new&page=1'
  const appUrl = 'https://crowdworks.jp/public/jobs/search?category_id=242&keep_search_criteria=true&order=new&hide_expired=true&page=1'
  const ecUrl = 'https://crowdworks.jp/public/jobs/search?category_id=226&keep_search_criteria=true&order=new&hide_expired=true&page=1'
  cookie = JSON.parse(cookie.sentence)
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
  const doBid = async (url, bid, type) => {
    try {
      const page = await browser.newPage();
      await page.setCookie(...cookie)
      await page.goto(url, { timeout: 60000 });
      await page.waitForSelector('.jobs_lists.jobs_lists_simple', { timeout: 60000 })
      const data = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.jobs_lists.jobs_lists_simple > li .item_title a[href]'),
          a => a.getAttribute('href').substring(a.getAttribute('href').lastIndexOf('/') + 1))
      });
      console.log(`Doing ${type} bid...`)
      console.log(`${data.length} links fetched...`)
      var cnt = data.length
      for (var jobid of data) {
        try {
          link = 'https://crowdworks.jp/proposals/new?job_offer_id=' + jobid
          console.log(link, `${cnt} links remained...`)

          const visited = await Visits.findOne({ link, account: id })
          const status = await Settings.findOne({ type: 'status', account: id })
          if (status.sentence == 'stopped') break
          if (!visited) {
            await page.goto(link)
            const url = await page.evaluate(() => document.location.href);
            if (url.indexOf('competition') > -1) {
              await Visits.create({ link, time: Date.now(), account: id })
              console.log("Competition...")
              continue
            } else if (url.indexOf('proposals/') > -1 && url.indexOf('proposals/new?job_offer_id') < 0) {
              await Visits.create({ link, time: Date.now(), account: id })
              console.log("Already applied...")
              continue
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
            var budgetValue = 0
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
                else budgetValue = 200000
              } else if (type == '時間単価制') {
                budgetValue = 3000
              }
            }
            console.log(type, budget, budgetValue)
            var amtEl, bidEl, sendBtn
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
                `.message-body.message_body_for_reply.cw-form_control`, bid)
            else
              await setProposalValues(page, `#hourly_wage_dummy_`, budgetValue.toString(),
                `.message-body.message_body_for_reply.cw-form_control`, bid)
            await new Promise((resolve) => {
              setTimeout(() => {
                resolve();
              }, 2000);
            })
            await page.evaluate(() => {
              const div = document.querySelector('.cw-form_horizontal.proposal');
              div.click();
            });
            await new Promise((resolve) => {
              setTimeout(() => {
                resolve();
              }, 2000);
            })
            await sendBtn.click()
            await new Promise((resolve) => {
              setTimeout(() => {
                resolve();
              }, 2000);
            })
            await Visits.create({ link, time: Date.now(), account: id })
          }
        } catch (e) {
          // await Visits.create({ link, time: Date.now() })
          console.log(e)
        }
        cnt--
      }
    } catch (e) {
      console.log(e)
    }
  }

  await doBid(webUrl, webBid.sentence, 'Web')
  await doBid(appUrl, appBid.sentence, 'App')
  await doBid(ecUrl, ecBid.sentence, 'Ec')

  await browser.close()
}

module.exports = { bot }