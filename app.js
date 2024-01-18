require('dotenv').config()
const express = require('express')
const TelegramBot = require('node-telegram-bot-api')
const AmazonPaapi = require('amazon-paapi')

const token = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: true })

const app = express()
app.use(express.json())

bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(
    chatId,
    'Welcome to your Amazon Affiliate Link Generator Bot!'
  )
})

bot.onText(/\/generate (.+)/, async (msg, match) => {
  const chatId = msg.chat.id

  const productLink = match[1]

  try {
    const affiliateLink = await generateAmazonAffiliateLink(productLink)
    bot.sendMessage(chatId, `Your affiliate link: ${affiliateLink}`)
  } catch (error) {
    bot.sendMessage(chatId, `Error generating affiliate link: ${error.message}`)
  }
})

async function generateAmazonAffiliateLink(productLink) {
  const credentials = {
    AccessKey: process.env.AMAZON_ACCESS_KEY,
    SecretKey: process.env.AMAZON_SECRET_KEY,
    PartnerTag: process.env.AMAZON_ASSOCIATE_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.in'
  }

  const asinRegex = /\/(?:dp|gp\/product)\/(\w{10})/
  const match = productLink.match(asinRegex)

  if (match && match[1]) {
    const asin = match[1]

    const requestParameters = {
      ItemIds: [asin],
      ItemIdType: 'ASIN',
      Condition: 'New',
      Resources: [
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'Images.Primary.Large'
      ]
    }

    const result = await AmazonPaapi.GetItems(credentials, requestParameters)
    const item = result.ItemsResult.Items[0]

    const affiliateLink = item.DetailPageURL + '&tag=' + credentials.PartnerTag
    return affiliateLink
  } else {
    throw new Error(
      'Invalid Amazon product link. Please provide a valid Amazon product link.'
    )
  }
}

console.log('Bot is starting...')
