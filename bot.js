const puppeteer = require('puppeteer-extra');
const cookie = require('./constants/crowdworks.jp.cookies.json')
const Visits = require('./db/visits')
const Bids = require('./db/bids');
const moment = require('moment');
const auto = async () => {
  await page.goto('https://crowdworks.jp/public/jobs/search?category_id=230&hide_expired=true&keep_search_criteria=true&order=new&page=1');
  await page.waitForNavigation('networkidle2')
  await page.waitForSelector('.jobs_lists.jobs_lists_simple')
  var lis
  const data = await page.evaluate(() => {
    lis = Array.from(document.querySelectorAll('.jobs_lists.jobs_lists_simple li'))
    return lis.map(td => td.textContent)
  });
  console.log(lis.length)

}
const bot = async () => {

  const webBid = await Bids.findOne({ type: 'web' })
  const mobileBid = await Bids.findOne({ type: 'mobile' })
  const ecBid = await Bids.findOne({ type: 'ec' })
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
    // headless: true,
    // devtools: false,
    // args: [
    //   '--disable-gpu',
    //   '--disable-dev-shm-usage',
    //   '--no-sandbox',
    //   '--disable-setuid-sandbox',
    //   '--ignore-certificate-errors',
    //   '--ignore-certificate-errors-spki-list'
    // ]
  });
  try {
    const page = await browser.newPage();
    await page.setCookie(...cookie)

    await page.goto('https://crowdworks.jp/public/jobs/search?category_id=230&hide_expired=true&keep_search_criteria=true&order=new&page=1',);
    await page.waitForSelector('.jobs_lists.jobs_lists_simple', { timeout: 60000 })
    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.jobs_lists.jobs_lists_simple > li .item_title a[href]'),
        a => a.getAttribute('href').substring(a.getAttribute('href').lastIndexOf('/') + 1))
    });
    for (var link of data) {
      try {
        link = 'https://crowdworks.jp/proposals/new?job_offer_id=' + link
        console.log(link)

        const visited = await Visits.findOne({ link })
        if (!visited) {
          await page.goto(link)
          const url = await page.evaluate(() => document.location.href);
          if (url.indexOf('competition') > -1) {
            await Visits.create({ link, time: Date.now() })
            continue
          }
          await page.waitForSelector('.job_offer-conditions', { timeout: 60000 })
          const conds = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.job_offer-conditions .condition_body'),
              e => e.innerHTML.trim())
          });
          console.log(conds)
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
              // if under 5000
              if (budget.indexOf('〜  5,000円') > -1) budgetValue = 4000
              // if 5000 ~  10000
              if (budget.indexOf('5,000円  〜  10,000円') > -1) budgetValue = 8000
              // if 10000 ~ 50000 
              if (budget.indexOf('10,000円  〜  50,000円') > -1) budgetValue = 40000
              // if 50000 ~ 100000 
              if (budget.indexOf('50,000円  〜  100,000円') > -1) budgetValue = 80000
              // if 100000 ~ 2000000 
              if (budget.indexOf('100,000円  〜  300,000円') > -1) budgetValue = 260000
              // if 300000 ~ 5000000 
              if (budget.indexOf('300,000円  〜  500,000円') > -1) budgetValue = 450000
              // if 500000 ~ 10000000 
              if (budget.indexOf('500,000円  〜  1,000,000円') > -1) budgetValue = 800000
              else budgetValue = 2000000
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
          // await page.$eval('#username', el => el.value = 'areejsz126@gmail.com');
          // await page.$eval('#password', el => el.value = 'RootRoot123$');
          // await button.click()
          // await page.waitForNavigation({ waitUntil: 'networkidle2' })

          const setProposalValues = async (page, selector1, value1, selector2, value2) => {
            await page.waitForSelector(selector1);
            await page.click(selector1);
            await page.evaluate((data) => {
              return document.querySelector(data.selector).value = data.value
            }, { selector: selector1, value: value1 })
            await page.waitForSelector(selector2);
            await page.evaluate((data) => {
              return document.querySelector(data.selector).value = data.value
            }, { selector: selector2, value: value2 })
          }

          if (type == '固定報酬制')
            await setProposalValues(page, `#amount_dummy_`, budgetValue.toString(), `.message-body.message_body_for_reply.cw-form_control`, webBid.sentence)
          else
            await setProposalValues(page, `#hourly_wage_dummy_`, budgetValue.toString(), `.message-body.message_body_for_reply.cw-form_control`, webBid.sentence)
          await new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 3000);
          })
          await page.evaluate(() => {
            const div = document.querySelector('.cw-form_horizontal.proposal');
            div.click();
          });
          await new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 3000);
          })
          // await sendBtn.click()
          await new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 3000);
          })
          await Visits.create({ link, time: Date.now() })
        }
      } catch (e) {
        await Visits.create({ link, time: Date.now() })
        console.log(e)
      }
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = { bot }