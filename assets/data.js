
/* ---------- topics ---------- */
const TOPICS = {
  money:   {label:"Money phrases", c:"--t-money"},
  comp:    {label:"Comparison", c:"--t-comp"},
  adjprep: {label:"Adjectives + prepositions", c:"--t-prep"},
  verbprep:{label:"Verbs + prepositions", c:"--t-prep"},
  simple:  {label:"Simple tenses", c:"--t-tense"},
  cont:    {label:"Continuous tenses", c:"--t-tense"},
  perf:    {label:"Perfect tenses", c:"--t-tense"},
  perfcont:{label:"Perfect Continuous", c:"--t-tense"},
  mixed:   {label:"Mixed tenses", c:"--t-tense"},
  speak:   {label:"Speaking", c:"--t-speak"},
  write:   {label:"Writing", c:"--t-write"}
};
const MARQUEE = ["worth every penny","impulse purchase","save up for something","waste of money","good value for money","have second thoughts","treat yourself","splash out on something","the more, the better","as good as","the same as","keen on","fed up with","look forward to","have been waiting","had already left","will have saved"];
const OK_WORDS = ["correct","ok","✓","✔","+","no mistake","right","c"];
const SPEAK_RUBRIC = "Grammar 0–3 · Vocabulary of the unit 0–3 · Fluency 0–2 · Pronunciation 0–2";

const PHONES = `<div class="spec"><table>
  <thead><tr><th></th><th>📱 Nova X</th><th>📱 Orbit Y</th></tr></thead>
  <tbody>
    <tr><td>Price</td><td>$499</td><td>$499</td></tr>
    <tr><td>Weight</td><td>180 g</td><td>210 g</td></tr>
    <tr><td>Battery life</td><td>2 days</td><td>1 day</td></tr>
    <tr><td>Camera</td><td>50 MP</td><td>50 MP</td></tr>
    <tr><td>Screen</td><td>6.1″</td><td>6.7″</td></tr>
  </tbody></table></div>`;

// ---------- the three variants ----------
// [[answer|alternative]]  -> typed gap
// {{right* / wrong / wrong}}  -> drop-down gap (the option marked with a star is correct)
// mc: the first option is the correct one (options are shuffled on screen)
const TESTS = [
{
  id:"v1", hash:"variant-1", level:"B1", name:"Variant 1", minutes:60,
  sub:"Деньги, сравнения, предлоги и все группы времён. Задания на письменную часть и устная часть с картинкой.",
  tasks:[
    {type:"match", topics:["money"], title:"Money phrases: what do they mean?",
     instr:"Match the phrases (1–8) with their meanings (A–H).",
     pairs:[
      ["worth every penny","expensive, but really worth the price"],
      ["an impulse purchase","something you buy suddenly, without planning it"],
      ["save up for something","keep money for some time so you can buy something"],
      ["a waste of money","something that was not worth buying at all"],
      ["good value for money","good quality for a fair price"],
      ["have second thoughts","start to doubt a decision you have made"],
      ["treat yourself","buy something nice for yourself as a reward"],
      ["splash out on something","spend a lot of money on something special"]]},

    {type:"bank", topics:["money"], title:"Money phrases in context",
     instr:"Complete the sentences with the phrases from the box. There are two extra phrases.",
     bank:["impulse purchase","worth every penny","saving up for","Treat yourself","had second thoughts","waste of money","splashed out","good value for money"],
     items:[
      "I saw these headphones at the airport and bought them without thinking. It was a total [[impulse purchase]].",
      "My new winter boots cost a lot, but they are warm and comfortable. They were [[worth every penny]].",
      "Kate is [[saving up for]] a new laptop. She puts away £20 every week.",
      "You passed all your exams! [[Treat yourself]] to something nice.",
      "I wanted to buy a car, but then I [[had second thoughts]]. It was too expensive to run.",
      "That gym membership was a [[waste of money]]. I only went there twice!"]},

    {type:"mc", topics:["comp"], title:"Comparison: choose the correct option",
     instr:"Choose the correct answer: a, b or c.",
     items:[
      {q:"The more you practise, ___ you become.", o:["the better","better","the best"]},
      {q:"My phone is ___ yours. We bought the same model.", o:["the same as","the same like","same than"]},
      {q:"This café isn't ___ the one near the station.", o:["as cheap as","as cheaper as","cheap as"]},
      {q:"___ the price, the more people want to buy it.", o:["The lower","Lower","The lowest"]},
      {q:"Second-hand clothes are ___ new ones. They're much cheaper.", o:["not as expensive as","as expensive as","not so expensive than"]},
      {q:"The longer we waited, ___ we became.", o:["the angrier","angrier","the most angry"]}]},

    {type:"transform", topics:["comp"], title:"Comparison: say it another way",
     instr:"Complete the second sentence so that it means the same as the first. Use the word in capitals.",
     items:[
      {q:"My bag cost $40. Your bag cost $40 too.", key:"SAME", stem:"My bag cost [[the same as]] yours."},
      {q:"Tom is 180 cm tall. Mike is 175 cm tall.", key:"TALL", stem:"Mike is [[not as tall as|not so tall as]] Tom."},
      {q:"If you earn more, you spend more.", key:"THE", stem:"[[The more]] you earn, the more you spend."},
      {q:"This hotel is cheaper than that one.", key:"EXPENSIVE", stem:"This hotel is [[not as expensive as|not so expensive as]] that one."}]},

    {type:"gap", topics:["adjprep"], title:"Adjectives + prepositions",
     instr:"Write the missing preposition: to, for, at, in, on, of, with or about.",
     items:[
      "My sister is afraid [[of]] spiders.",
      "Are you interested [[in]] modern art?",
      "I'm really bad [[at]] maths, but good at languages.",
      "Paris is famous [[for]] the Eiffel Tower.",
      "Our new teacher is very kind [[to]] everyone.",
      "I'm tired [[of]] waiting for this bus!",
      "She was angry [[with|at]] her brother because he broke her phone.",
      "My little brother is keen [[on]] video games."]},

    {type:"choice", topics:["verbprep"], title:"Verbs + prepositions",
     instr:"Choose the correct preposition from the list.",
     items:[
      "Who does this jacket belong {{to*/for/at}}?",
      "I'm looking forward {{to*/for/on}} the summer holidays.",
      "We arrived {{in*/at/to}} London late at night.",
      "Please don't laugh {{at*/on/to}} me!",
      "Our plans depend {{on*/of/from}} the weather.",
      "This song reminds me {{of*/for/on}} my school days.",
      "I spend too much money {{on*/for/in}} clothes.",
      "Do you agree {{with*/to/on}} me?"]},

    {type:"photogap", topics:["cont"], title:"In the park right now",
     instr:"Look at the photos. What are the people doing right now? Use the verbs from the box in the Present Continuous.",
     box:["eat","fly","play","read","ride","take","walk"],
     cards:[
      {img:"v1-bike", emoji:"🚴", text:"Tom [[is riding]] a bike."},
      {img:"v1-reading", emoji:"📖", text:"Anna [[is reading]] a book under a tree."},
      {img:"v1-football", emoji:"⚽", text:"The children [[are playing]] football."},
      {img:"v1-dog", emoji:"🐕", text:"Mr Brown [[is walking]] his dog."},
      {img:"v1-icecream", emoji:"🍦", text:"Lily [[is eating]] an ice cream."},
      {img:"v1-photo", emoji:"📸", text:"Sam and Kate [[are taking]] a photo."},
      {img:"v1-kite", emoji:"🪁", text:"Ben [[is flying]] a kite."}]},

    {type:"choice", topics:["simple","cont"], title:"Simple or Continuous?",
     instr:"Choose the correct form of the verb.",
     items:[
      "Every Saturday my mum {{goes*/is going}} to the market.",
      "Look! It {{is raining*/rains}} again.",
      "I {{was watching*/watched}} TV when my friend called me.",
      "What {{did you buy*/were you buying}} at the shop yesterday?",
      "Water {{boils*/is boiling}} at 100°C.",
      "This week I {{am working*/work}} from home because the office is closed.",
      "While we {{were walking*/walked}} in the park, it started to rain.",
      "Your bags look heavy. I {{will help*/am helping}} you with them."]},

    {type:"gap", topics:["perf"], title:"Perfect tenses",
     instr:"Put the verbs in brackets into the Present Perfect, Past Perfect or Future Perfect.",
     items:[
      "I [[have never been]] (never / be) to Japan.",
      "She [[has just bought|'s just bought]] (just / buy) a new phone.",
      "When we got to the cinema, the film [[had already started|'d already started]] (already / start).",
      "[[Have you finished]] (you / finish) your homework yet?",
      "By next June, I [[will have saved]] (save) enough money for a trip.",
      "They [[have lived|have been living]] (live) in this flat since 2015."]},

    {type:"gap", topics:["perfcont"], title:"Perfect Continuous tenses",
     instr:"Put the verbs in brackets into the Present, Past or Future Perfect Continuous.",
     items:[
      "I'm so tired! I [[have been working]] (work) all day.",
      "How long [[have you been learning]] (you / learn) English?",
      "Her eyes were red because she [[had been crying|'d been crying]] (cry).",
      "It [[has been raining|'s been raining]] (rain) since this morning.",
      "By 6 p.m. we [[will have been driving]] (drive) for ten hours."]},

    {type:"story", topics:["mixed"], title:"Max and the guitar",
     instr:"Read the story and put the verbs in brackets into the correct tense.",
     text:"Last summer Max [[saw]] (see) a beautiful guitar in a shop window. It cost $600, but Max [[did not have]] (not have) that much money. While he [[was walking]] (walk) home, he decided to save up for it. Since then, he [[has saved|'s saved]] (save) almost $500. At the moment he [[is working]] (work) in a café at weekends. He [[has been working|'s been working]] (work) there for four months. Max [[hopes]] (hope) that by the end of this month he [[will have saved]] (save) enough. “It [[will be]] (be) worth every penny!” he says."},

    {type:"speaking", topics:["speak","money"], photos:[{img:"v1-sale", emoji:"🛍️", cap:"Sale time"}], title:"Speaking: describe the photo",
     instr:"Look at the photo. Prepare for 1 minute, then speak for about 2 minutes.",
     prompts:[
      "Describe the photo. Where is the woman? What is she doing? What is she holding?",
      "Do you think she is making an impulse purchase? Why or why not?",
      "Is shopping in a sale as enjoyable as it looks? What are the risks?",
      "Tell about something you bought that was worth every penny, and something that was a waste of money.",
      "When did you last treat yourself? What did you buy?"],
     phrases:["In the photo I can see…","In the background…","She seems to be…","It looks like…","I think she has just bought…","Sales aren't as good as…"],
     prep:60, talk:120, max:10},

    {type:"speaking", topics:["speak"], title:"Speaking: answer the questions",
     instr:"Answer the questions. Speak for 30–40 seconds on each one. Try to use the grammar from this test.",
     prompts:[
      "Compare shopping online and shopping in a real shop. Use as … as / not as … as.",
      "“The more money you have, the happier you are.” Do you agree? Why?",
      "What are you saving up for at the moment? How long have you been saving?",
      "What were you doing yesterday at 7 p.m.?",
      "What have you never done but would really like to do?",
      "Tell about something you are interested in and something you are tired of."],
     phrases:["I've been … for …","I was … when …","I've never …","The more …, the …","I'm keen on …","I'm fed up with …"],
     prep:0, talk:240, max:10}
  ]
},
{
  id:"v2", hash:"variant-2", level:"B1", name:"Variant 2", minutes:60,
  sub:"Те же темы, другие форматы: диалог, письмо, таблица для сравнения, порядок слов и ролевая игра.",
  tasks:[
    {type:"mc", topics:["money"], title:"Money phrases: choose the best phrase",
     instr:"Read what the people say. Choose the best phrase.",
     items:[
      {q:"“I didn't plan to buy this jacket. I just saw it and took it.” It was ___.", o:["an impulse purchase","good value for money","worth every penny"]},
      {q:"“The tickets were cheap, and the concert was amazing!” The tickets were ___.", o:["good value for money","a waste of money","an impulse purchase"]},
      {q:"“I spent a lot on my birthday dinner, but it was a special day.” I ___ dinner.", o:["splashed out on","saved up for","had second thoughts about"]},
      {q:"“I was going to sign the contract, but then I wasn't sure.” I ___.", o:["had second thoughts","treated myself","splashed out"]},
      {q:"“This app cost $10 and it doesn't even work.” It was ___.", o:["a waste of money","worth every penny","good value for money"]},
      {q:"“I'm not spending any money this year because I want a car.” I'm ___ a car.", o:["saving up for","splashing out on","treating myself to"]}]},

    {type:"bank", topics:["money"], title:"Money phrases: complete the dialogue", dialogue:true,
     instr:"Complete the dialogue with the phrases from the box. There is one extra phrase.",
     bank:["splashed out on","impulse purchase","saving up for","worth every penny","waste of money","have second thoughts","treat yourself","good value for money"],
     items:[
      "<b>Amy:</b> Nice trainers! Are they new?",
      "<b>Jack:</b> Yes, I [[splashed out on]] them last weekend. They were $150.",
      "<b>Amy:</b> Wow! Was it an [[impulse purchase]]?",
      "<b>Jack:</b> No, I had been [[saving up for]] them for months.",
      "<b>Amy:</b> And are they comfortable?",
      "<b>Jack:</b> Very! They're [[worth every penny]]. My old ones were cheap, but they were a total [[waste of money]]. They broke after a month.",
      "<b>Amy:</b> I want some too, but I always [[have second thoughts]] when I see the price.",
      "<b>Jack:</b> Come on, [[treat yourself]]! You deserve it."]},

    {type:"gap", topics:["comp"], table:PHONES, title:"Compare two phones",
     instr:"Look at the table. Complete the sentences using the words in brackets.",
     items:[
      "Nova X costs [[the same as]] Orbit Y.",
      "The camera on Nova X is [[as good as]] the camera on Orbit Y. (good)",
      "Orbit Y [[is not as light as|is not so light as]] Nova X. (light)",
      "The screen on Nova X [[is not as big as|is not so big as]] the screen on Orbit Y. (big)",
      "[[The bigger]] the screen, the more battery the phone uses. (big)",
      "The battery on Nova X lasts [[twice as long as]] the battery on Orbit Y. (twice / long)"]},

    {type:"error", topics:["comp"], title:"Comparison: find the mistake",
     instr:"There is one mistake in each sentence. Write the correct word(s) only.",
     items:[
      {q:"My jeans are the same like yours.", a:["as"], full:"My jeans are the same as yours."},
      {q:"Tom isn't as tall than his father.", a:["as"], full:"Tom isn't as tall as his father."},
      {q:"The more I read, the more good I understand.", a:["better","the better"], full:"The more I read, the better I understand."},
      {q:"This test is as easier as the last one.", a:["easy","as easy as"], full:"This test is as easy as the last one."},
      {q:"More you practise, the faster you learn.", a:["The more"], full:"The more you practise, the faster you learn."}]},

    {type:"match", topics:["adjprep"], title:"Adjectives + prepositions: match the halves",
     instr:"Match the beginnings (1–8) with the endings (A–H).",
     pairs:[
      ["I'm really proud","of my little sister. She won the race!"],
      ["My parents were pleased","with my school report."],
      ["Are you excited","about the school trip?"],
      ["This city is very different","to the town where I grew up."],
      ["My aunt is married","to a famous chef."],
      ["Too much sugar is bad","for your teeth."],
      ["I'm fed up","with waiting. Let's go!"],
      ["Lisa is very good","at drawing portraits."]]},

    {type:"letter", topics:["verbprep"], title:"Verbs + prepositions: a postcard from Rome",
     instr:"Read Mia's message and write the missing prepositions.",
     from:"From: Mia · To: Sam",
     items:[
      "Hi Sam! I'm writing [[to]] you from Italy. We arrived [[in]] Rome on Monday, but our plane was late, so we arrived [[at]] the hotel after midnight.",
      "I've already spent all my money [[on]] pizza and souvenirs! Yesterday we waited [[for]] a bus for an hour, and my brother started to complain [[about]] everything.",
      "Today we're going to look [[at]] the Colosseum. I'm thinking [[of|about]] staying one more day. I'm really looking forward [[to]] seeing you next week!",
      "Love, Mia"]},

    {type:"photogap", topics:["cont"], title:"When the lights went out",
     instr:"Yesterday at 8 p.m. there was a power cut in a block of flats. What were the neighbours doing when the lights went out? Use the verbs from the box in the Past Continuous.",
     box:["cook","do","play","sleep","talk","watch"],
     cards:[
      {img:"v2-cooking", emoji:"🍳", text:"Mrs Green [[was cooking]] dinner."},
      {img:"v2-phone", emoji:"📱", text:"Mr Lee [[was talking]] on the phone."},
      {img:"v2-homework", emoji:"📚", text:"The children [[were doing]] their homework."},
      {img:"v2-sleeping", emoji:"💤", text:"Grandpa [[was sleeping]] in his armchair."},
      {img:"v2-guitar", emoji:"🎸", text:"Emma [[was playing]] the guitar."},
      {img:"v2-tv", emoji:"📺", text:"Dan [[was watching]] TV."}]},

    {type:"mc", topics:["mixed"], title:"Which tense?",
     instr:"Choose the correct answer: a, b or c.",
     items:[
      {q:"I ___ to the dentist tomorrow at 10. I've already booked it.", o:["am going","go","have gone"]},
      {q:"She ___ in London for five years, but now she lives in Paris.", o:["lived","has lived","has been living"]},
      {q:"___ you ever ___ sushi?", o:["Have / eaten","Did / eat","Are / eating"]},
      {q:"When I came home, my sister ___ dinner, so we ate together.", o:["had cooked","has cooked","cooks"]},
      {q:"This time next week we ___ on a beach in Spain.", o:["will be lying","lie","have lain"]},
      {q:"I ___ for you for 40 minutes! Where were you?", o:["have been waiting","am waiting","wait"]},
      {q:"By the time we got there, the shop ___.", o:["had closed","has closed","closes"]},
      {q:"He usually ___ to work, but today he's taking the bus.", o:["walks","is walking","has walked"]}]},

    {type:"choice", topics:["perf","perfcont"], title:"Perfect or Perfect Continuous?",
     instr:"Choose the correct form.",
     items:[
      "I {{have read*/have been reading}} three books this month.",
      "I {{have been reading*/have read}} this book for two hours, and I'm only on page 50.",
      "She's out of breath because she {{has been running*/has run}}.",
      "We {{have known*/have been knowing}} each other since school.",
      "They were tired because they {{had been walking*/have been walking/are walking}} for hours.",
      "By 2030, she {{will have been teaching*/will teach/teaches}} for 20 years."]},

    {type:"order", topics:["perf","perfcont","cont"], title:"Put the words in order",
     instr:"Make sentences. Write the whole sentence.",
     items:[
      {w:"been / you / have / how long / waiting / ?", a:["How long have you been waiting?"]},
      {w:"never / I / London / been / to / have", a:["I have never been to London."]},
      {w:"was / when / she / cooking / rang / the phone", a:["She was cooking when the phone rang.","When the phone rang, she was cooking."]},
      {w:"by / will / finished / have / Friday / we / the project", a:["We will have finished the project by Friday.","By Friday we will have finished the project."]},
      {w:"had / the train / already / left / we / when / arrived", a:["The train had already left when we arrived.","When we arrived, the train had already left."]}]},

    {type:"speaking", topics:["speak","comp"], photos:[{img:"v2-market", emoji:"🍎", cap:"A · At the market"},{img:"v2-online", emoji:"💻", cap:"B · Shopping online"}], title:"Speaking: compare two photos",
     instr:"Compare photos A and B. Prepare for 1 minute, then speak for about 2 minutes.",
     prompts:[
      "What can you see in each photo? What is similar and what is different?",
      "Is shopping at a market as convenient as shopping online? Which is cheaper?",
      "Finish the sentence: “The more you shop online, the …”",
      "Where do you usually buy food and clothes? Why?",
      "Have you ever had second thoughts after buying something online?"],
     phrases:["Both photos show…","In photo A…, whereas in photo B…","… isn't as … as …","… is the same as …","The more …, the …"],
     prep:60, talk:120, max:10},

    {type:"speaking", topics:["speak","money"], title:"Speaking: role play",
     instr:"Work in pairs. Each student reads one card and plays the role for 2–3 minutes. Then answer the teacher's questions.",
     cards:[
      {t:"Student A", d:"You want to buy very expensive headphones ($300). Explain to your friend why they are worth every penny. You have been saving up for them for three months."},
      {t:"Student B", d:"Your friend wants to buy expensive headphones. You think it is a waste of money. Suggest cheaper headphones that are good value for money and compare them (as … as, not as … as)."}],
     prompts:[
      "What is the best thing you have ever bought?",
      "What were you doing when you decided to buy it?",
      "What will you have bought by the end of this year?"],
     phrases:["I've been saving up for…","They're worth every penny because…","Don't you think it's a waste of money?","These ones are just as good as…"],
     prep:60, talk:180, max:10}
  ]
},
{
  id:"v3", hash:"variant-3", level:"B1+", name:"Variant 3", minutes:70,
  sub:"Уровень B1+: открытые пропуски, трансформации с ключевым словом, поиск ошибок без подсказок и письменное задание.",
  tasks:[
    {type:"gap", topics:["money"], title:"Money phrases: one missing word",
     instr:"Write ONE word in each gap to complete the phrase.",
     items:[
      "These boots cost a fortune, but they were worth every [[penny]].",
      "I'm saving [[up]] for a trip to Japan.",
      "On my birthday I always [[treat]] myself to a nice dinner.",
      "We decided to splash [[out]] on a new sofa.",
      "The tickets weren't cheap, but the show was good value [[for]] money.",
      "I was going to accept the job, but then I had [[second]] thoughts.",
      "Buying that exercise bike was a complete [[waste]] of money.",
      "The chocolate bar I bought at the till was an [[impulse]] purchase."]},

    {type:"transform", topics:["money"], title:"Money phrases: key word transformations",
     instr:"Complete the second sentence so that it means the same as the first. Use the word in capitals. Use 2–5 words.",
     items:[
      {q:"I bought the dress without planning to. I just saw it and took it.", key:"IMPULSE", stem:"The dress was [[an impulse purchase|an impulse buy]]."},
      {q:"The laptop was expensive, but it was absolutely worth it.", key:"PENNY", stem:"The laptop was [[worth every penny]]."},
      {q:"Paul is putting money aside because he wants to buy a motorbike.", key:"SAVING", stem:"Paul [[is saving up for|'s saving up for|is saving for]] a motorbike."},
      {q:"I started to doubt my decision to move abroad.", key:"SECOND", stem:"I [[had second thoughts|started to have second thoughts|began to have second thoughts]] about moving abroad."},
      {q:"They spent a lot of money on a luxury holiday.", key:"SPLASHED", stem:"They [[splashed out on]] a luxury holiday."}]},

    {type:"transform", topics:["comp"], title:"Comparison: key word transformations",
     instr:"Complete the second sentence so that it means the same as the first. Use the word in capitals.",
     items:[
      {q:"As you get older, you become wiser.", key:"THE", stem:"[[The older]] you get, [[the wiser]] you become."},
      {q:"My sister and I earn exactly the same salary.", key:"SAME", stem:"I earn [[the same as]] my sister."},
      {q:"The book was more interesting than the film.", key:"AS", stem:"The film was [[not as interesting as|not so interesting as]] the book."},
      {q:"Health is the most important thing in life.", key:"AS", stem:"Nothing in life is [[as important as]] health."},
      {q:"Expensive hotels usually have better service.", key:"MORE", stem:"[[The more expensive]] the hotel, the better the service usually is."},
      {q:"Prices this year are almost equal to last year's.", key:"HIGH", stem:"Prices this year are almost [[as high as]] last year."}]},

    {type:"story", topics:["adjprep"], title:"Leo and his cars",
     instr:"Read the text and write the missing prepositions.",
     text:"My cousin Leo has always been crazy about cars. In fact, he's completely obsessed [[with]] them. When he was a kid, he was hooked [[on]] racing games and was famous [[for]] knowing every car model in our town. His parents were worried [[about]] his grades, because he wasn't very interested [[in]] school subjects. But they were also proud [[of]] him, because he was capable [[of]] fixing almost anything. Now Leo is married [[to]] a mechanic, and he's never bored [[with|of]] his job. He says he feels sorry [[for]] people who don't love what they do."},

    {type:"error", topics:["verbprep"], title:"Verbs + prepositions: correct or not?",
     instr:"Some sentences have a mistake with a preposition. Write the correct word(s). If the sentence is correct, write CORRECT.",
     items:[
      {q:"I'm thinking to buy a new car.", a:["of buying","about buying","of","about"]},
      {q:"She insisted on paying for dinner.", a:OK_WORDS},
      {q:"You should apply to this job. You'd be great!", a:["for","apply for"]},
      {q:"We arrived to the airport two hours early.", a:["at","arrived at"]},
      {q:"Stop laughing on me. It isn't funny!", a:["at","laughing at"]},
      {q:"Do you believe in ghosts?", a:OK_WORDS},
      {q:"My parents invested all their savings on a small café.", a:["in","invested in"]},
      {q:"They argued about money all evening.", a:OK_WORDS}]},

    {type:"photogap", topics:["perf"], title:"What has just happened?",
     instr:"Look at the photos. Put the verbs in brackets into the Present Perfect. In sentence 6 use the Past Perfect.",
     cards:[
      {img:"v3-cast", emoji:"🩼", text:"Tom [[has broken|'s broken]] (break) his leg."},
      {img:"v3-wedding", emoji:"💍", text:"Kate and Dan [[have just got married|'ve just got married]] (just / get married)."},
      {img:"v3-graduation", emoji:"🎓", text:"Mia [[has just graduated|'s just graduated|has graduated]] (just / graduate) from university."},
      {img:"v3-moving", emoji:"📦", text:"The Smiths [[have moved|'ve moved|have just moved]] (move) into a new flat."},
      {img:"v3-car", emoji:"🔑", text:"Leo [[has just bought|'s just bought]] (just / buy) his first car."}],
     after:["When Tom's friends came to the hospital, the doctor [[had already put|'d already put]] (already / put) his leg in plaster."]},

    {type:"story", topics:["mixed"], title:"How I learned to save",
     instr:"Put the verbs in brackets into the correct tense. Think about all twelve tenses.",
     text:"I [[have always been]] (always / be) bad at saving money. Ten years ago, while I [[was studying]] (study) at university, I [[spent|was spending]] (spend) everything I earned on clothes and gadgets. One day my bank called: I [[had spent|'d spent]] (spend) more money than I [[had]] (have) in my account! That day I [[decided]] (decide) to change. Since then I [[have been keeping|have kept]] (keep) a notebook of all my expenses. Now I [[save]] (save) 20% of my salary every month, and this year I [[am saving|am saving up]] (save) for a trip to Peru. By next summer I [[will have saved]] (save) $3,000, and this time next year I [[will be walking]] (walk) along the Inca Trail. The more I save, the less I want to spend!"},

    {type:"mc", topics:["mixed"], title:"Choose the best tense",
     instr:"Choose the correct answer: a, b or c.",
     items:[
      {q:"“Why are your hands so dirty?” “I ___ in the garden.”", o:["have been working","have worked","work"]},
      {q:"By the time the police arrived, the thief ___.", o:["had escaped","escaped","has escaped"]},
      {q:"Don't call me at 9 tonight. I ___ the match.", o:["will be watching","will have watched","watch"]},
      {q:"I ___ this film three times, and I still love it.", o:["have seen","have been seeing","saw"]},
      {q:"We ___ for hours when we finally found the hotel.", o:["had been driving","have been driving","are driving"]},
      {q:"The train ___ at 7:15 tomorrow morning, so don't be late.", o:["leaves","has left","had left"]},
      {q:"By the end of this course, we ___ more than 50 grammar topics.", o:["will have studied","will study","are studying"]},
      {q:"She ___ to the radio when she heard the news.", o:["was listening","has been listening","listens"]},
      {q:"I ___ him since we left school.", o:["haven't seen","didn't see","hadn't been seeing"]},
      {q:"How long ___ English before you moved to London?", o:["had you been learning","have you been learning","are you learning"]}]},

    {type:"transform", topics:["perf","perfcont"], title:"Tenses: key word transformations",
     instr:"Complete the second sentence so that it means the same as the first. Use the word in capitals.",
     items:[
      {q:"I started working here three years ago.", key:"FOR", stem:"I [[have been working here for|have worked here for]] three years."},
      {q:"The last time I saw Anna was in May.", key:"SINCE", stem:"I [[have not seen Anna since|have not seen her since]] May."},
      {q:"The guests left. Then we arrived.", key:"ALREADY", stem:"When we arrived, the guests [[had already left|had already gone]]."},
      {q:"This is the first time I have eaten sushi.", key:"NEVER", stem:"I [[have never eaten|have never tried]] sushi before."},
      {q:"Our plan is to finish the project before Friday.", key:"HAVE", stem:"We [[will have finished]] the project by Friday."}]},

    {type:"writing", topics:["write","money"], title:"Writing: a blog post",
     instr:"Write a blog post (100–130 words) called “The best and the worst thing I have ever bought”.",
     checklist:["at least 3 money phrases from the unit","one comparison: as … as / not as … as / the …, the …","at least 2 adjectives or verbs with prepositions","at least 3 different tenses"],
     rubric:"Task 0–3 · Grammar 0–3 · Vocabulary 0–2 · Organisation 0–2", min:100, maxw:130, max:10},

    {type:"speaking", topics:["speak","money"], photos:[{img:"v3-saving", emoji:"🐷", cap:"A · Saving"},{img:"v3-spending", emoji:"💳", cap:"B · Spending"}], title:"Speaking: compare the photos",
     instr:"Compare photos A and B. Prepare for 1 minute, then speak for about 1.5 minutes.",
     prompts:[
      "What are the people doing? How do you think they feel?",
      "Who do you think will be happier in a year? Why?",
      "Is saving money as important as enjoying life now?",
      "“The more you earn, the more you spend.” Do you agree?"],
     phrases:["Whereas…","He seems to have been saving for…","She has probably just splashed out on…","I'd rather … than …","It isn't as … as it looks"],
     prep:60, talk:90, max:10},

    {type:"speaking", topics:["speak"], title:"Speaking: discussion",
     instr:"Discuss the questions with your teacher. Give reasons and examples.",
     prompts:[
      "Tell about a time you had second thoughts about a purchase. What had you already done before you changed your mind?",
      "What have you been doing recently to improve your English? How long have you been doing it?",
      "Where do you think you will be living in ten years? What will you have achieved by then?",
      "Compare your life now with your life five years ago. Use not as … as, the same as, the more … the more.",
      "What is your town famous for? What are young people there keen on, and what are they fed up with?",
      "Is it better to treat yourself often or to save up for one big thing?"],
     phrases:["Looking back, I'd already…","I've been … for …","By then I'll have…","Compared to five years ago…","On the one hand… on the other hand…"],
     prep:0, talk:300, max:10}
  ]
}];

