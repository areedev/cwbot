var mongoose = require('mongoose');
var dbConfig = require('../db/config');
var Bids = require('../db/bids');
mongoose.connect(dbConfig.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, async (err) => {
  var bids = [{
    sentence: 'はじめまして\nWebデザイナー＆プログラマーとして以前に勤めていたWeb制作会社でデザイン、HTML/CSSコーディング、JavaScript(React.js, Node.js, AngularJS, Nuxt.js, Next.js, Vue.js)、PHP(Laravel, CakePHP)、Python(Django, Flask)、Ruby on Rails、Excel VBA、WordPress、Shopifyでの制作など幅広く経験しております。美しさと繊細さが調和した素晴らしいサイトを設計することにより、あなたの企業を成功へと導いて行きたいのが私の立場です。\n\n尚、納品物の完成度が高い事は当然として、 何より「制作スピード」にこだわっています。\n\n私自身、現在フリーランスで活動しているため間の融通が利きますし、メッセージのやり取りもスムーズに行うことができます。\n\n案件のご相談やお見積もりのご相談などお気軽にご連絡ください。\nお客様の立場にたって仕事を進めたいので、お客様の企業の一員になったつもりで一所懸命に、全力で作成させていただきます。\nご連絡いただければ、すぐに対応できる態勢を整えておりますので、どうぞよろしくお願い致します。\n\n\n以下は作成したサイトになります。\n\nhttp://kanae-dentalclinic.com/ \nhttps://www.shop-advangen.com\nhttps://career-town.net/lp/srpg/\nhttps://ulana.uranai.jp\nhttps://d.excite.co.jp\nhttps://vernis.co.jp\nhttps://eminal-clinic.jp/recruit/\nhttps://foundfund.jp/kouko/\nhttps://fujiko-san.com/\nhttps://www.netbk.co.jp/contents/recruit/\nhttps://www.iphone-repairrescue.com/\n\n何かご不明の点などがございましたら、お気軽にご連絡ください。\n何卒宜しくお願い致します。',
    type: 'web'
  }, {
    sentence: 'はじめまして\nWebデザイナー＆プログラマーとして以前に勤めていたWeb制作会社でデザイン、HTML/CSSコーディング、JavaScript(React.js, Node.js, AngularJS, Nuxt.js, Next.js, Vue.js)、PHP(Laravel, CakePHP)、Python(Django, Flask)、Ruby on Rails、Excel VBA、WordPress、Shopifyでの制作など幅広く経験しております。美しさと繊細さが調和した素晴らしいサイトを設計することにより、あなたの企業を成功へと導いて行きたいのが私の立場です。\n\n尚、納品物の完成度が高い事は当然として、 何より「制作スピード」にこだわっています。\n\n私自身、現在フリーランスで活動しているため間の融通が利きますし、メッセージのやり取りもスムーズに行うことができます。\n\n案件のご相談やお見積もりのご相談などお気軽にご連絡ください。\nお客様の立場にたって仕事を進めたいので、お客様の企業の一員になったつもりで一所懸命に、全力で作成させていただきます。\nご連絡いただければ、すぐに対応できる態勢を整えておりますので、どうぞよろしくお願い致します。\n\n\n以下は作成したサイトになります。\n\nhttp://kanae-dentalclinic.com/ \nhttps://www.shop-advangen.com\nhttps://career-town.net/lp/srpg/\nhttps://ulana.uranai.jp\nhttps://d.excite.co.jp\nhttps://vernis.co.jp\nhttps://eminal-clinic.jp/recruit/\nhttps://foundfund.jp/kouko/\nhttps://fujiko-san.com/\nhttps://www.netbk.co.jp/contents/recruit/\nhttps://www.iphone-repairrescue.com/\n\n何かご不明の点などがございましたら、お気軽にご連絡ください。\n何卒宜しくお願い致します。',
    type: 'ec'
  },
  {
    sentence: 'はじめまして\nお忙しいところ大変恐縮ですがご確認して頂けると幸いです。\n\n職種：Android & iOSアプリデザイナー&コーダー　兼　プログラマー\n経歴：以前、勤めていたWeb & アプリ制作会社で、\n✅デザイン、HTML/CSSコーディング、JavaScript実装、PHP、Python、Flutter、React Native、Swift、Kotlinでの制作など幅広く経験しております。\n✅グーグルプレイアップルストアへのリリースにも豊富な経験も持っています。\n美しさと繊細さが調和した素晴らしいアプリを設計することにより、あなたの企業を成功へと導いて行きたいのが私の立場です。\n\n尚、納品物の完成度が高い事は当然として、何より「制作スピード」にこだわっています。\n\n私自身、現在フリーランスで活動しているため時間の融通が利きますし、メッセージのやり取りもスムーズに行うことができます。\n\n案件のご相談やお見積もりのご相談などお気軽にご連絡ください。\nお客様の立場にたって仕事を進めたいので、お客様の企業の一員になったつもりで一所懸命に、全力で作成させていただきます。\nご連絡いただければ、すぐに対応できる態勢を整えておりますので、どうぞよろしくお願い致します。',
    type: 'mobile'
  }
  ]
  await Bids.collection.deleteMany();
  await Bids.collection.insertMany(bids);
  // await Ranks.collection.deleteMany();
  // await Ranks.collection.insertMany(rank)

  // var streamers = await Streamers.find()
  // for (let i = 0; i < streamers.length; i++) {
  //   var s = streamers[i];
  //   s.id = generateHash(s._id.toString())
  //   await s.save()
  // }
  // var users = await Users.find()
  // for (let i = 0; i < users.length; i++) {
  //   var s = users[i];
  //   s.id = generateHash(s._id.toString())
  //   await s.save()
  // }
  process.exit(0);
});