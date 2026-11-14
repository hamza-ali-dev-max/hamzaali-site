# Front Desk AI: research report and rebuild plan

13 November 2026. Research only. No code, no site changes, nothing bought.

This file has three parts:

1. **What the research says** (this section, with the contradictions to the brief).
2. **The rebuild plan** for v2, section by section, plus the offer, the voice stack and the South African content direction.
3. **Open questions** only the owners can answer.

After that come the **seven full thread reports**, which carry a source link beside every claim.

## How to read the evidence

Every claim in the thread reports is tagged:

- **[READ]** the researcher opened the page and saw it.
- **[SEARCH]** it came from a web search summary only.
- **[UNVERIFIED]** it could not be confirmed, or the only source is the vendor's own marketing.

Totals across the seven threads: 198 read first-hand, 134 from search summaries, 21 unverified. "T3" below means "see Thread 3".

Limits you should know about:

- An automated research run was tried first. Its page reader was blocked by network rules and it verified only five claims from one competitor page, so it was set aside and seven researchers were run instead, one per thread.
- HelloPeter, Reddit, most of Stats SA, Google's AI docs, Stripe, Linear, Apple and the design award galleries could not be opened. Facts from those are search-only.
- **No genuine interviews with South African small business owners were found.** The owner quotes that exist are mostly from the US and UK. This is the biggest gap in the research and no amount of desk research closes it.

## The ten findings that matter most

1. **Nobody in South Africa has proof.** About 16 local players sell AI receptionists for R680 to R7,500 a month and almost none shows a public customer review or an independent case study (T2). The first page with a real pilot client and counted calls wins on trust.
2. **The isiXhosa promise cannot be supported today.** No mainstream vendor sells an isiXhosa voice. The best speech recognition gets 20 to 34% of isiXhosa words wrong (T4). The best-funded local rival, Untapped AI, ships English and Afrikaans only and asks callers to switch ([TechCentral](https://techcentral.co.za/lost-in-translation-why-ai-voice-agents-fail-south-africans/282607/)). xAI does not list Afrikaans or isiXhosa as supported. Afrikaans answered one typed test correctly but has never been tested on a phone call.
3. **Which third language is right depends on the city.** Census 2022: Cape Town is 37.4% isiXhosa, Durban 65.6% isiZulu, Johannesburg about 29% isiZulu ([Stats SA](https://www.statssa.gov.za/publications/03-01-84/03-01-84.pdf), T3). isiXhosa is a Cape Town and Gqeberha claim, not a national one.
4. **R1,999 is a fair price. The structure is wrong.** Global plans that actually book and transfer cost R1,634 to R2,459 (T5). 400 minutes for R1,999 gives more minutes per rand than most local rivals (T2). But the R2,500 setup fee is the outlier: self-serve rivals here and abroad charge nothing, and most offer a free trial (T1, T2, T5). The closest rival, [Remi](https://whichvoip.co.za/reviews/remi-review/), sells 500 minutes with WhatsApp reminders for R1,900, no setup fee, one free week.
5. **"One recovered booking a month pays for it" is false for half the target industries.** A salon or physio needs about four bookings, a dentist about three (T5).
6. **An AI receptionist does not replace a receptionist.** The only real South African call data (2,544 live calls, [WhichVoIP](https://whichvoip.co.za/ai-voice-agent/ai-receptionist-call-data/)): the AI resolved 37.8% of calls alone, handed 51.2% to a person, and 15% of callers hung up during the greeting. WhichVoIP sells its own AI receptionist, so it is an interested source, but its own buyer's guide still advises after-hours and overflow cover first (T2, T3).
7. **WhatsApp is the real front desk.** It reaches about 96% of South African internet users, and the phone is only the third choice for starting contact (T3). Stronger rivals send the caller a WhatsApp confirmation. v1 only messages the owner (T2).
8. **The missed call is lost twice in South Africa.** People screen unknown numbers, so the owner's call-back at 18:00 from a cell phone also goes unanswered ([ITWeb/Snupit](https://www.itweb.co.za/article/call-screen-culture-hurts-small-businesses-snupit-warns/GxwQDM1DWpJ7lPVo), T7). No competitor says this.
9. **The famous missed-call statistics are fake or stale.** "85% never call back", "80% do not leave voicemail" and "$126K a year" have no traceable source. "62% of calls go unanswered" is a 2016 count of 85 US businesses (T7). No independent South African figure exists (T3).
10. **Telling callers it is an AI helps.** In the one independent hands-on test, 43 of 61 missed calls were booked; 6 callers hung up on realising it was AI and disclosing it upfront fixed that ([Lilach Bullock](https://www.lilachbullock.com/ai-phone-receptionist-small-business-test/), one client, T1). A dataset of 450,702 calls from Upfirst links disclosure to fewer hang-ups (vendor data, T7).

## Where the research contradicts the brief or v1

| Brief or v1 says | Evidence says | Source |
|---|---|---|
| Works in English, Afrikaans and isiXhosa, switching mid-call | Only English is proven. Afrikaans is untested on phone audio. isiXhosa is not sold by any mainstream vendor | T2, T4 |
| R2,500 once-off setup fee | No self-serve rival charges one. It can be 48% of a three-month spend | T1, T2, T5 |
| "One recovered booking a month pays for it" | False for salons, physios and dentists | T5 |
| "Every call answered. No receptionist salary." (replacement pitch) | Live SA data shows about half of calls still need a person. Sell after-hours and overflow | T2, T3 |
| Receptionist costs R8,000 to R15,000 | About R8,000 to R9,000 (Indeed R8,019, PayScale about R9,095). The top of that range comes from a vendor blog that contradicts itself | T2, T5 |
| Compare only against a salary | A human answering service costs R790 a month for 200 calls, office hours only. That is the real alternative | T2 |
| "POPIA compliant" | Calls are processed by US providers. Rivals with SA hosting sell that difference. Replace the badge with specifics | T2 |
| Load shedding as a local angle | 525+ days without load shedding ([Eskom, Oct 2026](https://allafrica.com/stories/202610050125.html)) | T3, T4 |
| Slow South African connections are the constraint | Median mobile speed is 65.7 Mbps ([ITWeb](https://www.itweb.co.za/article/sa-remains-regional-outlier-for-mobile-download-speeds/rxP3jqBEzGjMA2ye)). Data cost and weak phones are the constraint | T6 |
| Township references for a South African feel (spaza, taxi rank, hand-painted signs) | The buyers are dentists, physios, vets, law firms and guesthouses. Borrowed styling would be its own cliche | T6 |
| Sky-blue hero with clouds (v1) | Arini already uses clouds. Yoco owns bright blue with SA small businesses. It is the least ownable choice | T6 |
| The name "Front Desk AI" | Taken twice: Frontdesk (US, formerly My AI Front Desk) and ICTGlobe's "Frontdesk AI" sold to SA resellers | T7 |
| VoiceReceptionist.co.za is R999 and R1,500 (my earlier note) | Now R1,199 and R1,999, and it is browser-only, not a phone line | T2 |

One thing v1 got right: its headline is already clearer than most competitors' (T7), and Grok was the right engine for English. It now tops the independent ranking at the same price ([Artificial Analysis](https://artificialanalysis.ai/speech-to-speech), T4).

# Rebuild plan for v2

## The idea in one line

**v2 sells "the calls you miss", shows one call from ring to WhatsApp, and proves it with a number you can phone.**

It keeps the human in the picture, promises only what has been tested, and ends every call in WhatsApp.

## The page, section by section

| # | Section | What it is | Why (evidence) |
|---|---|---|---|
| 1 | Header | Logo, short links, a "Call the demo line" number, "Start free trial". Keep the language and dark mode switches | Rosie, Smith.ai and Dialzara all put a number in the header (T1, T7) |
| 2 | Hero: one call, start to finish | A self-playing, pausable stage set in a named SA business. 19:02, the practice is closed, the phone rings. Transcript lines appear, the diary slot "Thu 10:00" fills, a WhatsApp lands on the owner's phone and a confirmation on the caller's. "Hear this call" plays the real recording and drives the same steps | Goodcall's staged hero is the best call visual in the category and uses plain CSS (T1, T6). Nobody has done it with rand, WhatsApp and a South African business |
| 3 | Without us, with us | Two lanes, one evening. Without: 18:42 phone rings, owner is busy, caller taps the next business on Google, 19:30 owner calls back, caller ignores the unknown number. With: answered, booked, WhatsApp sent | The "lost twice" insight is South African and unused (T7) |
| 4 | Try it | Three rungs. 10 seconds: the hero plays by itself. 1 minute: pick your business type and either get a call or dial the demo line. 5 minutes: free trial on your own number, after-hours only | Phone first, because it needs no microphone permission (T7). Every serious rival has a live try-it path (T1) |
| 5 | What happens on a call | Replaces the icon cards. Four moments drawn as real artefacts: the greeting ("I'm the practice's AI assistant"), the diary entry, the WhatsApp to the caller, the WhatsApp to the owner | Icon-in-circle cards are the template tell the owner disliked (T6). WhatsApp is the SA front desk (T3) |
| 6 | When it hands over | "Books the simple calls. Passes the rest to you in under a minute, with a WhatsApp summary." Shows the transfer, the urgent-call rule and the "say 'person'" escape | Dead ends are the top complaint about rivals (T1). 51.2% of real SA calls needed a person (T2) |
| 7 | Your kind of business | Four trades first, each with that trade's real caller questions and a real photo: dentists and doctors, physios, salons, guesthouses. Others listed below | Suggested first segments from T3. Real client photos replace stock (T6) |
| 8 | Your own numbers | A three-input calculator: missed calls a week, average booking value in rand, how many would have booked. No borrowed percentages | Every popular statistic is untraceable (T7) |
| 9 | Pricing | Two plans and a line for multi-branch. No setup fee. Free trial. Sold in calls, not minutes | T5 |
| 10 | Honest answers | FAQ rewritten around real objections: will my clients hate a robot, what if it gets it wrong, what it will not do, where calls are processed, which languages are live | Frontdesk's "what it will not do" block reads as confident (T1). POPIA specifics beat a badge (T2) |
| 11 | Start | Free trial form that goes to WhatsApp, plus the demo line again | |
| 12 | Footer | Real contact details. No placeholders | A dead number on a page that sells answering the phone is the worst signal (T7) |

## Design and motion direction

- **Drop:** the sky photo, the pill badge, icon-in-circle cards, stock photos.
- **Palette:** warm paper background, near-black ink, one hot sign-writer colour (a rooibos red-orange), a deep teal. WhatsApp green appears only at the WhatsApp moment. Contrast to be checked before committing (T6).
- **Type:** a grotesque with character for headings (Bricolage Grotesque is a free candidate), a plain body face, and three to five words of real hand lettering.
- **Pictures:** the Cape Town partner photographs three real client businesses on a phone, with signed consent, used as cut-outs on flat colour. No AI-generated pictures. Commission a South African illustrator for a small spot set once there is revenue.
- **South African through specifics, not symbols:** 24-hour times, "R1 999" written the local way, real suburbs and names, WhatsApp everywhere, a light "now now" or "sharp" in small copy. No flag colours, no Table Mountain, no load shedding.
- **Motion system:** CSS only, moving position and opacity, two speeds (200 ms and 400 ms), one hero sequence, a Pause button, and a still version for people who turn motion off. No animation libraries, no autoplay video, no build step. Budget under 10 KB (T6).
- **References and what to take from each:** [Goodcall](https://www.goodcall.com/) the staged hero and Pause button. [Smith.ai](https://smith.ai/ai-receptionist) the recording with a transcript that follows it. [Dialzara](https://dialzara.com/) the call-this-number card. [Yoco](https://www.yoco.com/za/) one strong colour held by neutrals, local product names, real merchants. Full list with links in Thread 6.

## The offer

| Plan | Price | What you get |
|---|---|---|
| After Hours | R999 a month | Answers when you are closed or do not pick up. Up to 100 calls. Bookings, messages, a WhatsApp summary of every call |
| Front Desk (featured) | R1,999 a month | Every call, day and night. Up to 250 calls. WhatsApp confirmation and reminder to the customer, urgent calls put through, a monthly report in rand |
| Multi-branch | From R3,999 a month | Up to three numbers and calendars |

- **Setup: R0.** Shown as "done-for-you setup, included".
- **Trial: 14 days free on the client's real number, no card**, capped at 100 minutes. Worst-case cost to you about R150.
- **Month to month.** Extra usage R2.50 a minute, a WhatsApp warning at 80%, never cut off. Spam and hang-ups under 10 seconds not counted.
- **The line:** "R67 a day, and one extra booking a week pays for it." R1,999 over 30 days is R66.63. One booking a week covers it for a dentist check-up, a physio session, a guesthouse night, a car service or a legal consult (T5).
- **Margins** at about R1.50 a minute all-in: 74% on After Hours, 56% on Front Desk at the cap and about 82% at typical use (T5). These rest on search-sourced booking values and WhatsApp rates, so check them before printing.
- State whether prices include VAT. Rivals differ and it moves the comparison by 15%.

This is a recommendation, not a decision. The one-plan offer could stay if the setup fee goes and a trial is added.

## Voice and tech

1. **English and Afrikaans: stay on Grok Voice 3.0**, pinned to that version, at $0.08 a minute (T4).
2. **Connect the phone line straight to xAI over SIP** with a Twilio South African number ($1.50 a month, $0.0067 a minute). This removes the audio bridge built in v1 (T4).
3. **If Afrikaans fails testing, fall back to ElevenLabs Agents**, the only stack that lists Afrikaans for both hearing and speaking (T1, T4).
4. **isiXhosa and isiZulu come off the promise.** The page says: "English and Afrikaans today. If a caller speaks isiXhosa or isiZulu, we take a message or put them through to you." Offer a waitlist.
5. **Budget $0.10 to $0.12 a minute all-in** (R1.65 to R2.00). Expect replies in about 1.0 to 1.3 seconds: no provider checked has servers in Africa, so do not claim "instant".
6. **Before any language goes on the page, test it with real speakers:** 20 or more calls each from Afrikaans and accented-English speakers, on Vodacom and MTN, in a car and a busy shop, including surnames, place names, phone numbers, rand amounts and mid-sentence switching (T4).

Catches: Twilio local numbers need a business address in each area code. xAI's own documents now call the company "SpaceXSI", so check the name before printing it anywhere.

## What changes from v1, and why

| v1 | v2 | Why |
|---|---|---|
| "AI receptionist" that replaces a salary | "The calls you miss", alongside your people | Half of real calls need a person (T2) |
| Three static hero cards | One call that plays, ring to WhatsApp | The owner's complaint. Goodcall shows it works (T6) |
| English, Afrikaans, isiXhosa | English live, Afrikaans after phone tests, others "in testing" | Nothing on the market supports the claim (T4) |
| R1,999 plus R2,500 setup, sold in minutes | Two plans, R0 setup, free trial, sold in calls | Rivals charge no setup. Owners count calls (T5) |
| "One booking a month pays for it" | "One extra booking a week pays for it" | The first is false for salons, physios and dentists (T5) |
| WhatsApp to the owner | WhatsApp to the owner and the caller | Rivals already do. It beats call screening (T2, T7) |
| "POPIA compliant" badge | Where calls are processed, a data agreement, the AI notice | Rivals sell SA hosting against this (T2) |
| Sky photo, icon cards, stock photos | Paper palette, real artefacts, real client photos | Template tells. Sky is taken (T6) |
| Browser microphone as the main demo | Phone demo line first, microphone second | No permission prompt. Rivals lead with a number (T7) |
| Placeholder contact details | Real ones, or the page does not go out | T7 |

# Open questions for you

1. **Languages.** Are you willing to launch on English only, add Afrikaans after phone tests, and move isiXhosa to "in testing"? Or is isiXhosa essential to the business, in which case testing it comes before the page?
2. **The name.** "Frontdesk AI" is already used by a US product and by ICTGlobe in South Africa. Keep it, or rename before more is built on it?
3. **Positioning.** Sell after-hours and overflow cover that works with a receptionist, as the evidence suggests, or keep the bolder "no receptionist salary" pitch?
4. **The offer.** Two plans at R999 and R1,999 with no setup fee and a 14-day trial, or keep one plan? Are you comfortable giving up the R2,500 setup income, which covers your pre-launch costs?
5. **Proof.** Can the Cape Town partner sign one pilot business, run it free for 30 days and let you publish the counted calls? That would beat every local rival's page.
6. **Owner conversations.** The research found no real South African owner interviews. Will the Cape Town partner talk to ten owners (three dentists or doctors, three salons, two guesthouses, two trades) before the page is written? Their words should be the copy.
7. **Photos.** Can the partner photograph three real client businesses, with consent? If not, the fallback is illustration, which costs money.
8. **A first-party statistic.** Do you want to run a small mystery-call test (phone 50 Cape Town businesses at lunch, 17:30 and Saturday morning) so the page can quote an honest South African number?
9. **Demo line.** A South African Twilio number needs a local business address and documents. Whose address, and can that start now?
10. **Colour.** The last brief asked for sky blue. The research says that look is taken. Are you open to the warmer paper palette?
11. **Page languages.** Keep the page itself in English and Afrikaans, and hold the isiXhosa version until a native speaker has reviewed it?

# Evidence: the seven thread reports

Each report below is the researcher's own write-up, unedited apart from this heading. Source links sit beside the claims they support.

Where a thread report and the plan above disagree, the plan is the considered position. One example: Thread 6 suggests a load shedding line as a local touch, while Threads 3 and 4 show load shedding ended in May 2025, so the plan drops it.


## Thread 1: Global competitors


Researched 13 November 2026. Tags: [READ] = I fetched the page myself, [SEARCH] = web search summary only, [UNVERIFIED] = vendor claim or could not confirm. Vendor pages are [READ] for what they say, but their numbers about themselves (customers, calls handled) are still vendor claims.

### Findings

#### 1. Plans and prices (all vendor pricing pages read 13 Nov 2026)

| Product | Entry plan | Middle plans | Top self-serve | Billing unit and overage | Booking and transfer first appear | Trial | Source |
|---|---|---|---|---|---|---|---|
| Rosie | $49, 250 min | $149, 1,000 min | $299, 2,000 min | Per minute. Going over moves you to the next plan (per eesel reading of Rosie terms) | Calendar booking, warm and live transfer only from $149 Scale. $49 only texts a booking link | 7 days | [READ] https://heyrosie.com/pricing , https://www.eesel.ai/blog/best-ai-for-receptionists |
| Goodcall | $79, 100 unique callers | $129, 500 callers | $299, 2,000 callers | Per unique caller per month, no minute meter. 79c, 26c, 15c per extra caller. Spam not counted | All plans, limited by "workers" and "external tools" (1 tool on Starter) | Free demo agent, pay when a number is connected | [READ] https://www.goodcall.com/pricing |
| Dialzara | $29, 60 min | $99, 220 min. $199, 500 min | $349, 1,000 min | Per minute. $0.48, $0.45, $0.40, $0.35 | Blind transfer on all. Warm transfer, calendar sync, after-hours rules from $99 Pro | 7 days, "No setup fees" | [READ] https://dialzara.com/pricing |
| Frontdesk (My AI Front Desk) | $99 ($79 annual), 200 voice min, 400 SMS, 100 chats, CRM | none | Custom | Per minute via credits, $0.25 per min | Included, but "2 of each" agent action | 7 days | [READ] https://www.myaifrontdesk.com/pricing |
| Smith.ai AI Receptionist | Free, 25 calls per month forever | $150 for 75 calls, $270 for 150 | $500 for 300, $800 for 500 | Per call. $3.00 extra on Free, $2.50 to $2.10 on paid. Human escalation "$3 extra" | AI scheduling and routing on all plans | Free plan | [READ] https://smith.ai/pricing/ai-receptionist , https://smith.ai/ , https://dupple.com/learn/how-much-does-an-ai-receptionist-cost |
| Reception by ElevenLabs | $29, 75 min, 1 call at a time | $79, 275 min, 3 concurrent | $199, 1,000 min, 10 concurrent | Per minute. $0.45, $0.38, $0.30 | "Every plan includes auto appointment booking" | Free trial, no card | [READ] https://elevenlabs.io/reception |
| Aira | $24.95, 30 calls | $59.95 (90), $159.95 (300) | $299, 600 calls | Per call. $1.50, $1.00, $0.75, $0.70 | Booking and transfers on all plans. Outbound SMS only from Pro | Not stated on page | [READ] https://www.getaira.io/pricing |
| Upfirst | $24.95, 30 calls | $59.95 (90), $159.95 (300) | $299, 600 calls | Per call. Spam, silent calls and calls under 15 s not billed | All plans | 14 days, no card | [READ via] https://dupple.com/learn/best-ai-receptionists |
| CallSphere | $19 "Answer" | $49 "Act", $99 "Orchestrate" | $149 "Custom Build" | Platform fee plus usage "at cost": about $0.15 per min inbound | Booking from $49, warm transfer from $99 | 7 days | [READ] https://callsphere.ai/pricing |
| Trillet | $49, 150 min | none | none | $0.20 per min | Calendar booking, inbound only | 28-day money back | [READ via] https://dupple.com/learn/how-much-does-an-ai-receptionist-cost |
| Quo (OpenPhone) Sona | $19 to $47 per user phone plan, about 10 Sona calls included | $25 for 40 calls, $49 for 100 | $199 for 600 calls | Per call, $1.00 down to $0.45 | n/a | 7 days | [SEARCH] https://www.usecarly.com/blog/quo-pricing/ |
| Ruby (humans only) | $250, 50 min | $395 for 100, $720 for 200 | $1,725 for 500 | Per minute | n/a | n/a | [SEARCH] https://www.usecarly.com/blog/ruby-receptionist/ |
| Abby Connect (human plus AI) | $164, 50 "Abby Minutes" | $329 for 100, $599 for 200 | $1,380 for 500 | AI minute counts as half | n/a | Free trial | [SEARCH] https://www.usecarly.com/blog/abby-connect/ |
| Retell, Vapi (builder platforms) | $0.07 to $0.31 per min (Retell). Vapi about $82 to $129 for 1,000 min all-in | | | Pure usage | You build it | $10 and $5 free credit | [READ] https://www.retellai.com/pricing , https://vapi.ai/pricing |

- Independent arithmetic at 300 calls of 3 minutes: Goodcall $129, Trillet $199, Frontdesk $264, Dialzara $349, Smith.ai AI $500, Smith.ai humans $2,100. [READ] https://dupple.com/learn/how-much-does-an-ai-receptionist-cost (4 Nov 2026)
- At 200 calls of 3 minutes "real bills run from $105 to $899". [READ] https://www.eesel.ai/blog/best-ai-for-receptionists (4 Nov 2026)
- No setup fee found on any global small-business product. Dialzara and Smith.ai say so explicitly. [READ] same pricing pages.

#### 2. Homepage promise and how each explains itself

- Rosie: "The easiest AI answering service for small business". Explains through "three bad options" (answer yourself, voicemail, pay "$2/minute" for a service), then 3 steps. Claims 2,000+ businesses and "3.1m+" calls [UNVERIFIED]. [READ] https://heyrosie.com/
- Goodcall: "Your AI voice agent answers every call." Second promise: "No per-minute charges. A bill you can predict." [READ] https://www.goodcall.com/
- Dialzara: "The AI Receptionist Who Never Misses A Call". Leads with missed-call stats (38% of calls answered, 80% leave no voicemail) [UNVERIFIED]. [READ] https://dialzara.com/
- Frontdesk: "AI receptionist that calls, texts, emails, and chats". Now pitched as an "AI workforce" for property management and retail, with voice, SMS, WhatsApp, email and chat on one customer memory. [READ] https://www.myaifrontdesk.com/
- Smith.ai: now "End-to-end intake for law firms", "25 calls / month, free forever". [READ] https://smith.ai/
- Reception: "AI receptionists that answer every call", "The most realistic sounding AI receptionist service", "Go live in under 5 minutes", "now available for businesses globally". [READ] https://elevenlabs.io/reception
- Aira: "Your AI workforce for the front office. Fully staffed, 24/7." Compares $3,000 receptionist, $400 answering service, $24.95 Aira. [READ] https://www.getaira.io/

#### 3. How a visitor can try it

- Call a real number: Dialzara (866-545-ZARA card in the hero), Rosie (412-569-0026 in the header), Frontdesk demo line +1 (864) 619-0619, Vapi 1-844-HEY-VAPI, Smith.ai (380) 333-6907 with suggested scenarios such as "I've been in a car accident". [READ] the home pages above, https://www.myaifrontdesk.com/pricing
- Talk in the browser: Vapi "Start call" with use-case tabs, Bland "Click to speak with an agent" with industry tabs, CallSphere "Tap me to talk to Voice AI Agent" in "57+ languages", Reception Chat or Voice toggle. [READ] https://vapi.ai/ , https://www.bland.ai/ , https://callsphere.ai/ , https://elevenlabs.io/reception
- It calls you: Retell "Get a call from Selina", Reception "Get a call". [READ] https://www.retellai.com/
- Recorded samples: Rosie has four ("Scheduling a haircut appointment", "Requesting a hot tub cleaning quote"). Smith.ai plays a recording with a synced transcript and labels it "This is a recording". Goodcall has "Hear Rosie", "Hear Alex", "Hear Hero" voice samples. [READ]
- Build before paying: Goodcall free demo agent, Frontdesk hero input "Your business website", Aira "Browser-based test calls". [READ]

#### 4. Features competitors have that Front Desk AI v1 does not show

- Auto-training from a website or Google Business Profile: Rosie, Dialzara, Frontdesk ("Read 214 pages from your website"), Aira, Reception. [READ]
- Call summary, transcript and recording on every plan, pushed by text, email or app: Rosie, Dialzara, Goodcall, Smith.ai. Rosie has iOS and Android apps. [READ]
- Spam handling: Rosie blocks robocalls, Smith.ai blocks "20 million+ known spammers", Upfirst and Goodcall do not bill spam. [READ]
- SMS to the caller during the call (Rosie Scale), two-way AI SMS (Dialzara $19 plus $0.05 per message), free web chat bundled with voice (Rosie, Dialzara). [READ]
- Warm transfer with a briefing, and "waterfall" transfer across several numbers (Rosie Growth, Goodcall). [READ]
- Pre-launch testing: Goodcall practice calls, Smith.ai "Quality Studio", Frontdesk simulated conversations. [READ]
- Outbound calls: Dialzara from $750 per month, Frontdesk capped at 20 per day. [READ]
- Human backup: Smith.ai, Abby. WhatsApp: only Frontdesk mentions it. [READ]
- Languages: Rosie English and Spanish only, Dialzara 10, Frontdesk "20+", Aira "74+", Reception "90+". None of the fetched competitor pages names Afrikaans, isiZulu or isiXhosa, and none mentions South Africa. [READ] grep across all fetched pages.

#### 5. What customers and testers say

- Lilach Bullock, 90-day test on a Kent heating firm (published 9 Jul 2026, one client, unnamed "Smith.ai style" product, author sells AI consulting): 61 previously missed calls answered, 43 booked, 12 callbacks, "6 hung up once they realised they weren't talking to a person". Plan was GBP 199 for 100 calls. "An AI phone receptionist won't sound human, and customers often clock it within the first ten seconds". Failures: complaints where the AI "kept trying to steer the conversation back to scheduling", elderly callers who paused (it "cut in too soon"), and urgency ("followed the calendar literally"). Fix: open with "you're speaking with our AI assistant" and instantly transfer on "leak", "no heat", "emergency". [READ] https://www.lilachbullock.com/ai-phone-receptionist-small-business-test/
- "What annoys people usually isn't that it's AI, it's when the AI is a dead end." Reddit r/smallbusiness, quoted in [READ] https://www.eesel.ai/blog/best-ai-for-receptionists (original: https://www.reddit.com/r/smallbusiness/comments/1ulegrs/home_service_owners_are_you_guys_actually_using/ov3mrt1/)
- "If I call a company and get AI, I hang up and call a competitor". Reddit, same article.
- "An AI receptionist answered, got confused during the scheduling flow and could not understand my address, asking me to repeat it over and over. And it couldn't forward to me to human. [...] I found a different contractor and never looked back." Hacker News https://news.ycombinator.com/item?id=47494045 via eesel [READ].
- "What actually worked for me was not full receptionist replacement. Front desk owns live hours. After hours + overflow ... is where the bot earns its keep." Reddit r/Dentists via eesel [READ].
- "the biggest dropoff came from asking for info too fast, you need a beat of small talk". Reddit via eesel [READ].
- Bait entry tiers: Rosie's "$49 entry tier [is] a message-taking service, not a true receptionist"; Dialzara Lite "is realistically a trial". [READ] https://dupple.com/learn/best-ai-receptionists
- Frontdesk: Trustpilot reviewers report being charged on day 8 of the trial and refused refunds; Capterra complaints cite 30+ hours of configuration. [SEARCH] https://www.trustpilot.com/review/www.myaifrontdesk.com , https://lunacal.ai/blogs/ai-receptionist
- Smith.ai: an August 2026 Trustpilot reviewer said the AI kept re-asking answered questions. Cancelling needs 30 days' notice. [SEARCH] and [READ] https://smith.ai/pricing/ai-receptionist
- Review bases are thin: Dialzara self-reports "4.2 out of 5 on Trustpilot from 20 reviews (October 2026)" [READ] https://dialzara.com/ ; Rosie reportedly had zero verified reviews on G2, Capterra and Trustpilot in June 2026 [SEARCH, competitor blog] https://serviceagent.ai/blogs/rosie-ai-pricing/
- Gartner 2026: 87% of 3,566 customers say a route to a human is essential. One vendor survey: 65% of over-65s would hang up on an AI, 12% of under-45s. [SEARCH] https://www.aianswering.ai/blog/customers-want-human-option-ai-answering , https://smartcallservice.com/blog/2026-small-business-phone-report

#### 6. Which sites feel alive, and the mechanism

- Goodcall is the best example of "the story of a call". The hero plays a scripted scene on its own: the owner types one plain sentence, "Gabi is building Rosie", a timer starts, an "Incoming example call" transcript appears line by line, then result cards land: "Sent to your CRM", "Texted to you", "Booked, in your calendar" with a week strip, "Customer's phone" and "Your team's phone" notifications. It has a "Pause animation" button. Below it: "Pick a job to see how it handles the call" tabs. [READ] https://www.goodcall.com/
- Smith.ai: audio player (0:49 of 2:29) with the transcript advancing in step, industry tabs (Law Firms, Home Services, IT), then "Want to hear how our AI handles your real call? Try the live demo". [READ] https://smith.ai/
- Reception: per-industry transcripts revealed word by word, a talk-now widget in the hero, promo video. [READ] https://elevenlabs.io/reception
- Aira: a live call card showing "Agents handling this call" with NOW, Next, Queued states. [READ] https://www.getaira.io/
- Static by comparison: Dialzara (a phone number card and stats) and Rosie (stacked text sections, audio clips far down the page). [READ]

### Surprises and things that contradict the v1 page or the brief

- ElevenLabs now sells its own small-business receptionist from $29 per month, "available for businesses globally", with booking on every plan. It is ranked first by both Dupple and eesel. The voice-quality leader is now a direct competitor, not only a supplier. [READ] https://elevenlabs.io/reception
- ElevenLabs' v4 model list includes Afrikaans and Zulu but not Xhosa. If the best-resourced voice vendor does not list isiXhosa, v1's isiXhosa claim is the riskiest line on the page. [READ] https://elevenlabs.io/docs/overview/models
- Bland's own realism benchmark puts Grok at 0.59 against 0.91 for Bland and 0.61 for ElevenLabs. [UNVERIFIED, vendor benchmark] https://www.bland.ai/
- The R2,500 setup fee has no global parallel. Every product read has no setup fee and most have a free trial or free tier.
- v1's price per included minute is fine. R1,999 for 400 minutes is about R5.00 per minute; at roughly R17.50 to the dollar [UNVERIFIED rate] that is near $0.29, against Rosie $0.20, Reception Plus $0.29, Dialzara Plus $0.40, Frontdesk $0.50. R3 overage (about $0.17) is cheaper than every per-minute rival read ($0.25 to $0.48). The problem is the entry point and setup fee, not the minute rate.
- Aira's four plans are Upfirst's four plans to the cent ($24.95, $59.95, $159.95, $299; 30, 90, 300, 600 calls). Likely a rebrand or white label. [UNVERIFIED]
- Goodcall changed pricing since June 2026 (Dupple's older article says Growth = 250 callers and 50c overage; the live page says 500 and 26c). Prices in this market move within months.
- Smith.ai and Frontdesk have both moved upmarket (law firm intake, property management). The plain "local small business" space is left to Rosie, Goodcall, Dialzara, Upfirst and Reception.

### What this means for v2 (each tied to evidence above)

1. Make the hero a self-playing, pausable call story: ring, greeting, question, booking, then the summary landing on the owner's phone and the calendar slot filling. Goodcall proves the pattern; nobody has done it with a South African business, rand amounts and a WhatsApp summary.
2. Add a real "try it" path in the hero: a South African demo number and a talk-in-browser button, with two or three suggested scenarios (Smith.ai pattern). Every serious competitor has at least one.
3. Add recorded sample calls with a synced transcript, one per industry and one in Afrikaans, labelled as recordings (Smith.ai, Rosie).
4. Have the AI say it is an AI in the greeting, and show that on the page. The Lilach test and the Reddit quotes both say disclosure plus a human path beats a human-sounding disguise.
5. Show the human path: urgent-keyword transfer, warm transfer with a summary, promised callback after hours. Dead ends are the top complaint.
6. Put booking and transfer in the base plan and say so. Gated entry tiers (Rosie $49, Dialzara $29) are the most criticised pricing move.
7. Drop or waive the setup fee and add a trial or money-back guarantee. Consider a lower entry tier or per-call billing; per-minute fear is real ("$150" overnight from one time-waster, HN quote in eesel).
8. Claim only languages proven in a recording. English plus Afrikaans, demonstrated, is already unique in this set. Hold isiXhosa until tested.
9. Position as after-hours and overflow cover first, full-time second (r/Dentists quote).
10. Add a short "what it will not do" block. Frontdesk does this and it reads as confident.
11. Features to close first: auto-learn from website or Google profile, summary plus recording after every call, spam not billed.

### Could not verify / gaps

- Reddit, G2, Trustpilot and Capterra are not directly readable here. All review material is via search summaries or quotes inside eesel's article.
- Rosie's exact overage rule is inside a collapsed FAQ; I rely on eesel's reading of Rosie's terms.
- Upfirst, Trillet, Quo, Ruby, Abby, Synthflow, Beside and Sameday pricing pages were not readable; figures are second-hand, and nothing was found for Beside or Sameday.
- Whether any of these vendors can supply a South African phone number was not confirmed. Goodcall is US local numbers only (eesel); Reception says non-US needs "brief additional setup".
- The Lilach Bullock numbers are one consultant's account of one client and cannot be checked.
- The dollar to rand rate used is an assumption.


## Thread 2: South African competitors and alternatives


Researched 13 November 2026. Tags: [READ] = I fetched the page; [SEARCH] = search summary only; [UNVERIFIED] = vendor claim or not confirmed. "WV" = whichvoip.co.za, a comparison site that takes referral fees and sells its own AI receptionist (it discloses both), so treat it as semi-independent.

### Findings

#### 1. The SA market is crowded, young and unproven

| Player | Price (rand) | Voice languages | Channels | Evidence quality |
|---|---|---|---|---|
| Remi (remireception.com, UK-registered, SA law) | Lite R1,900/mo, 500 min, R1.85/min over, R0 setup, 1 free week | English, Afrikaans. Messages "in all 11 official languages" | Phone, WhatsApp, SMS, email; missed-call text-back | No Google listing, no reviews. [READ] https://whichvoip.co.za/reviews/remi-review/ |
| Agent Help (Napier, W Cape, founded 2025) | R1,999 ex VAT, 150 min, R13/min over, R0 setup; R4,799/400 min; R6,749/750 min | English, Afrikaans. isiZulu and isiXhosa "on the roadmap" | Phone; WhatsApp confirmation in 30 seconds; reminders 24h and 1h | No Google listing, no reviews; Clutch profile empty. [READ] https://whichvoip.co.za/reviews/agent-help-review/ [SEARCH] https://clutch.co/profile/agent-help-pty |
| BizAI Voice Valet (Midrand) | R999 ex VAT, 100 min, up to 6 calls at once; own blog says R3.50/min over | English, Afrikaans | Phone; WhatsApp Business API (Meta partner); WhatsApp call summary; CRM | "83+ SA businesses" self-reported; no rated Google or HelloPeter profile. [READ] https://www.bizai.co.za/platform/voice-valet |
| AiSky (SA distributor of Singapore SmartAlex) | R1,999/mo yearly or R2,399 monthly; 250 min once-off, then R0.97/min; R0 setup | Claims all 11 official languages plus 75 more | Phone, WhatsApp, SMS, web chat | Launched 2026, names no customers, claim "not independently benchmarked". [READ] https://whichvoip.co.za/reviews/aisky-review/ |
| VoiceReceptionist.co.za (Mbombela) | R1,199/100 min; R1,999/200 min; hard cap, no overage | "SA English optimised" only | Browser link only, no phone number; email summaries | Only testimonial is its own "sister business". [READ] https://www.voicereceptionist.co.za/ |
| Virtual Receptionist (Vereeniging, since 2001) | AI R680 incl VAT, 60 min; hybrid human plus AI from R1,270 | "In the caller's language", none named | Phone, SMS, email | Google listing with zero reviews. [READ] https://whichvoip.co.za/reviews/virtual-receptionist-review/ |
| AskAndBook | R1,290/mo, 150 min, R4.10/min over | English, Afrikaans, isiZulu | Phone, WhatsApp | Vendor site only. [SEARCH] https://askandbook.app/ |
| SME Advantage (Delaware LLC, white-label HighLevel) | R849/mo plus R8.50 to R10.50/min billed in USD | Not stated | Phone, WhatsApp, SMS, CRM | US servers, no SA reviews. [READ] https://whichvoip.co.za/reviews/sme-advantage-review/ |
| Le Roux Digital (Cape Town agency) | R1,450/mo plus R3,950 setup, 3-month minimum | Not stated | Phone | Google 5.0 from 9 reviews, but for marketing work. [READ] https://whichvoip.co.za/reviews/le-roux-digital-review/ |
| Aiployee (Johannesburg) | R7,500 ex VAT unlimited min, one call at a time, R5,000 setup | "Natural SA accents" | Phone in and out | Google 5.0 from 2 reviews; SA-hosted. [READ] https://whichvoip.co.za/reviews/aiployee-review/ |
| AI Automated Solutions (Bellville) | AI Agent plan R5,000/mo ex VAT; typical build R14,900/mo | None listed | WhatsApp, chat, calls | Google 4.9 from 17 to 18 reviews, about chatbots, not calls. [READ] https://aiautomatedsolutions.co.za/pricing |
| LekkerAI (Cape Town) | R499 to R4,999 incl VAT | EN, AF, isiZulu, isiXhosa in text chat (from R2,499 plan) | Website chat only; WhatsApp is a wa.me button | No customers named. [READ] https://www.lekkerai.co.za/ |
| Untapped AI (Cape Town) | Quote only; "SME and enterprise models" | English, Afrikaans; isiZulu and isiXhosa "in development" | Phone | "5,000 agents live" includes its own group call centres. [READ] https://techcentral.co.za/lost-in-translation-why-ai-voice-agents-fail-south-africans/282607/ |
| Telviva Viva | Fixed monthly fee, amount unpublished | Not stated | Voice, WhatsApp, web chat | Promoted article. [READ] https://techcentral.co.za/telviva-launches-viva-a-digital-agent-built-for-south-african-businesses/285458/ |
| Cognexa, FrictionZero, IAMX | Quote only | FrictionZero: SA English, Afrikaans | Web, WhatsApp, voice | Agencies. Cognexa admits its portfolio is "our own studio demos, not client work". [READ] https://cognexa.co.za/ [SEARCH] https://frictionzero.pages.dev/ |
| PBX built-ins: 3CX, Yeastar | 3CX EUR 550/yr whole system (AI calls capped at 3 min); Yeastar R65/user/mo plus AI add-on | Yeastar "34 languages" | Phone | WV scores 7.9 and 7.2, the highest in the category. [READ] https://whichvoip.co.za/compare-ai-voice-agents/ |

- WV found public customer reviews for almost none of the dedicated voice players, so "Customer reviews" is "not scored" across the board. [READ] https://whichvoip.co.za/ai-voice-agent/
- No SA competitor publishes an independent case study with numbers. [READ, all pages above]

#### 2. Languages: nobody has shown isiXhosa or isiZulu voice working

- Untapped AI, the most technically serious local player (studio-recorded SA voices, SA data centres, ISO 27001), supports only English and Afrikaans; "when a caller switches to an African language, the agent asks them to continue in English or Afrikaans". TechCentral, 11 June 2026. [READ] https://techcentral.co.za/lost-in-translation-why-ai-voice-agents-fail-south-africans/282607/
- UCT's Jan Buys in the same article: buyers "should press vendors on ... what language support actually means and how it can be verified". Nine of 11 official languages are low-resource. [READ] same URL
- Untapped's CEO: "the drop-off rate is significantly higher when customers encounter robotic or foreign accents" (own call-centre data, vendor claim). [READ] same URL
- WV: "AiSky says it covers all 11 ... its own claim and not independently benchmarked"; AI "still falls short" on "heavy accents and calls that switch between English, isiZulu and Afrikaans mid-sentence". [READ] https://whichvoip.co.za/ai-voice-agent/
- Cognexa (a vendor, unusually candid): isiZulu and isiXhosa are "usable but needs checking", with errors "more likely to be subtly wrong than obviously broken"; voice is harder than text; a voice that mispronounces "Mthatha" or "Khoza" "undermines the whole interaction". [READ] https://cognexa.co.za/ai-chatbot-south-african-languages.html
- Lelapa's Vulavula docs reportedly show no isiXhosa speech-to-text and text-to-speech "Coming Soon". [SEARCH] https://docs.lelapa.ai/overview/language-support
- 1Stream's "400ms" piece (5 June 2026) is a CEO opinion column, not a benchmark: under 300ms "feels abrasive", over 700ms sounds like a struggling machine. [READ] https://www.itweb.co.za/article/the-400ms-benchmark-why-infrastructure-is-the-real-hurdle-for-sa-ai-bots-to-overcome/KzQenMjyPDe7Zd2r

#### 3. The only real SA performance data is sobering

- WV counted three months of a live SA AI receptionist (May to August 2026): 2,544 calls; 392 abandoned during the greeting; of 2,151 engaged calls 37.8% were resolved by the AI alone, 51.2% transferred to a person, 11.0% ended unresolved. Median handover took 42 seconds. One configuration change moved the handover rate 13 points. Quote: "An AI receptionist is not an appliance you install once." [READ] https://whichvoip.co.za/ai-voice-agent/ai-receptionist-call-data/
- By contrast BizAI claims AI "handles 80 to 90% of inbound calls with zero human intervention", with no data. [READ] https://www.bizai.co.za/blog/ai-vs-human-virtual-receptionist-south-africa-2026 [UNVERIFIED]

#### 4. What owners use instead, in rand per month

- Hired receptionist: PayScale average R109,145/yr (about R9,095/mo) [READ, quoted at https://www.bizai.co.za/platform/voice-valet]; Indeed about R7,827 to R8,019 [SEARCH] https://za.indeed.com/career/receptionist/salaries; another guide says R6,000 to R18,000, average R11,500 [SEARCH] https://www.ourpower.co.za/jobs/salary/receptionist. Legal floor: minimum wage R30.23/hr from 1 March 2026 [SEARCH] https://www.sanews.gov.za/index.php/south-africa/national-minimum-wage-rise-r3023-hour-march, about R5,240 (40h week) to R5,900 (45h), my arithmetic. Add UIF, leave and sick cover [UNVERIFIED, not sourced this session]. Covers one call at a time, office hours.
- Human answering service: Virtual Receptionist live agents R790 incl VAT for 200 calls, then R3 a call, R300 registration, weekdays 08:00 to 17:00 only, not public holidays; R2,065 for 700 calls. [READ] https://whichvoip.co.za/reviews/virtual-receptionist-review/ CallSync from R999 for 200 calls, R1,999 for 500 calls 24/7. [SEARCH] https://callsync.co.za/
- Regus virtual office R390 to R1,048/mo; call answering "on request". [SEARCH] https://www.regus.com/en-gb/south-africa/cape-town/virtual-offices
- Cloud PBX auto-attendant ("press 1"): Euphoria R65 to R185 per extension ex VAT. [SEARCH] https://whichvoip.co.za/reviews/euphoria-telecom-review/
- Voicemail and WhatsApp (free). MEF 2026 survey: South Africans start contact with companies by email 70%, WhatsApp 40%, phone 36%. [SEARCH] https://mobileecosystemforum.com/2026/09/18/mef-data-email-still-rules-in-south-africa-for-mobile-communications-with-brands/
- Pain points on record: human services "usually leave you a message rather than a booking" and "callers can usually hear that the person on the line doesn't know your business" (Cognexa, vendor) [READ] https://cognexa.co.za/ai-receptionist-vs-human-receptionist.html; allocated numbers belong to the answering service, accounts are suspended if unpaid by the 7th [READ] WV review above; callbacks fail because "South Africans are choosing not to answer their phones" and Truecaller labels small-business numbers as spam (Snupit, 8 Sep 2025) [READ] https://www.itweb.co.za/article/call-screen-culture-hurts-small-businesses-snupit-warns/GxwQDM1DWpJ7lPVo

#### 5. WhatsApp and POPIA

- WhatsApp is standard among the stronger players: Agent Help confirms on WhatsApp "within half a minute"; Remi replies on WhatsApp and texts back missed calls; BizAI and Telviva run the official WhatsApp Business API. [READ] sources in table
- POPIA: everyone says "compliant" or "designed for". The credible ones name hosting and paperwork: Agent Help (SA hosting, written operator agreement), Aiployee and Untapped (SA servers), BizAI (signed DPA). WV lists the sections that bite: 18, 21, 69, 71, 72. [READ] https://whichvoip.co.za/newsroom/no-ai-law-ai-receptionist-guide/

### Surprises and things that contradict the v1 page or the brief

1. The brief's VoiceReceptionist prices are stale. It is now R1,199/100 min and R1,999/200 min, and it is not a phone service at all: callers tap a browser link. [READ]
2. v1's minutes are generous, not expensive. R1,999 for 400 minutes (R5.00 per included minute) beats Agent Help (R13.33), BizAI (R9.99), AskAndBook (R8.60) and is close to Remi (R3.80). My arithmetic from the table.
3. v1's R2,500 setup fee is out of line. Remi, Agent Help, AiSky and BizAI charge R0. WV shows setup can be 48% of a three-month spend. [READ] https://whichvoip.co.za/ai-voice-agent/ai-voice-agent-cost-south-africa/
4. v1 claims isiXhosa that "switches in the middle of a call" [READ] https://hamzaali.ca/frontdesk-ai/. No credible SA competitor makes that claim for voice, and the best-funded local player says it is still in development. On an engine where isiXhosa is unlisted and untested, this is the riskiest sentence on the page.
5. v1 says "POPIA compliant" while calls would run through US providers (xAI, Twilio). Competitors with SA hosting sell exactly that difference.
6. BizAI's marketing contradicts itself: human receptionists cost "R8,000 to R15,000" in one post and "R3,000 to R8,000" in another; the "30% of calls unanswered" figure is credited to BaseCloud on the home page and to "BizAI customer data" in the blog. A real human service costs R790. Do not copy these numbers.
7. v1 only sends WhatsApp to the owner. Competitors send it to the caller.

### What this means for v2

1. Lead with proof, because nobody has any. A callable SA demo number in the hero (Agent Help, SME Advantage and Virtual Receptionist all have demo lines) plus one real pilot client with counted calls would beat every rival page. (Finding 1.)
2. Be honest about languages and turn that into trust. Say English and Afrikaans are live; show isiXhosa only after native speakers have tested it on real phone calls, or label it "in testing". Quote the UCT test: "ask us to prove it". (Finding 2.)
3. Sell the handover, not full automation. Use "answers every call, books the simple ones, passes the rest to you in under a minute with a WhatsApp summary". The 37.8% figure makes "replaces your receptionist" a promise that will fail. (Finding 3.)
4. Drop or waive the R2,500 setup fee and offer a free trial week. Keep the 400 minutes and say plainly that it is more minutes per rand than named rivals. State VAT basis. (Surprises 2, 3.)
5. Add caller-side WhatsApp: instant booking confirmation and reminder. It also solves the "nobody answers unknown callbacks" problem. (Findings 4, 5.)
6. Replace "POPIA compliant" with specifics: where audio is processed, a data processing agreement, the "this call is answered by an AI" notice. (Finding 5.)
7. Compare against the R790 human answering service and voicemail, not only a R9,000 salary: after hours, public holidays, bookings instead of messages, you keep your own number. (Finding 4.)

### Could not verify / gaps

- HelloPeter, Reddit r/southafrica and MyBroadband: mybroadband.co.za returned a Cloudflare challenge; searches found no owner threads or reviews about AI or human receptionists. Real owner quotes are still missing.
- clutch.co and za.indeed.com blocked direct reads (Cloudflare, login redirect); used search summaries.
- Agent Help, Remi, AiSky, AskAndBook, FrictionZero own sites were not readable; facts come from WV reviews or search. Nothing found for Astro Intelligence. No pricing for Untapped AI, Telviva Viva, Botlhale, Lelapa.
- WV's own AI receptionist price (BizAI says R3,500/mo) is unconfirmed, and the 2,544-call deployment is unnamed.
- UIF, leave and sick-leave costs were not sourced this session.
- Nobody's isiZulu or isiXhosa voice quality was tested by me or by any independent source I found.


## Thread 3: South African businesses: who needs this


Researched 13 November 2026. Tags: [READ] = I fetched the page; [SEARCH] = search summary only; [UNVERIFIED] = vendor claim or unconfirmed.
Access note: statssa.gov.za, hellopeter.com, reddit.com and the Standard Bank PDF are blocked in this session, and mybroadband.co.za returns 403 (Cloudflare). Those parts rest on search summaries and are flagged.

### Findings

#### 1. Missed calls: there is no independent SA number, and the global one is weak
- The "62% of small business calls go unanswered" figure traces to 411 Locals, a US marketing vendor: 85 businesses, 58 industries, 30 days; 37.8% answered live, 37.8% voicemail, 24.3% no response. Most sources date it January 2016; some sites relabel it "2024". Small, ten years old, US only, vendor-run. The companion claims ("85% never call back", "$126,000 a year lost") could not be traced to any primary study. [SEARCH] https://ainora.lt/blog/missed-call-statistics-small-business-2026 , https://www.getaira.io/blog/missed-business-calls-statistics
- Closest SA figure: BaseCloud says 30% of incoming sales calls go unanswered, from its own client data. One client case: 50% missed, caused by a faulty phone system, not staff. [UNVERIFIED, vendor] https://basecloudglobal.com/sales-calls-issue-in-south-africa/
- RecoMed (SA doctor and dentist booking marketplace) claims 70% of its bookings are made after hours. Same figure since 2021, no method published. [UNVERIFIED, vendor] https://www.recomed.co.za/business/
- WhichVoIP (SA comparison site, verified 29 May 2026) says default voicemail "loses roughly two-thirds of business calls because callers hang up". No source given. [READ] https://whichvoip.co.za/phone-systems/ai-agent-to-answer-business-calls/
- Real, current, SA: SAPS told Parliament this week that about 1.79 million of roughly 9 million calls to 10111 were abandoned (about 20%). Not a business stat, but it shows how normal "nobody picks up" is for SA callers. [SEARCH] https://thestar.co.za/news/2026-11-12-south-africans-left-waiting-for-police-as-10111-abandons-nearly-18-million-calls/

#### 2. Which businesses, beyond the v1 list
- Trades and home services (plumbers, electricians, pest control, solar, handymen): Snupit (600+ service categories, since 2012) says "Phone calls are often the first step in understanding the scope of a job" and "when calls go unanswered, it stalls the process entirely", causing delayed quotes and cancelled jobs. Press release, 8 Sep 2025. [READ] https://www.itweb.co.za/article/call-screen-culture-hurts-small-businesses-snupit-warns/GxwQDM1DWpJ7lPVo
- Appointment businesses with a calendar (GPs, dentists, physios, salons, workshops, attorneys): WhichVoIP names exactly these as the textbook fit because "the workflow is identical every time". [READ] same WhichVoIP URL
- Guesthouses and B&Bs: NightsBridge serves 10,000+ independent properties, so one integration reaches most of the segment. [SEARCH] https://iol.co.za/travel/south-africa/2024-11-03-from-frustrated-honeymooners-to-the-most-successful-online-accommodation-bookings-platform-in-south-africa-the-story-of-nightsbridge/
- Security and armed response: HelloPeter's ADT page (TrustIndex 2.3/10, 248 reviews in 12 months) lists unanswered calls and dropped lines as a theme. That is a large firm, but small armed-response companies carry the same expectation. [SEARCH] https://www.hellopeter.com/adt-security
- Estate agents: every "50 to 80% of Property24 leads go unanswered" claim is unsourced vendor copy. [UNVERIFIED] https://propertyfunnels.club/post/portal-lead-response-time-south-africa
- No SA evidence found for driving schools, funeral parlours, tyre fitment, optometrists, crèches, tow trucks or panel beaters. Plausible, unproven.

#### 3. Languages (Census 2022)
- National home language: isiZulu 24.4%, isiXhosa 16.3%, Afrikaans 10.6%. [SEARCH, Stats SA] https://www.statssa.gov.za/?p=18173
- Cape Town metro: isiXhosa 37.4%, English 30.6%, Afrikaans 26.1%. Stats SA says Cape Town has the highest English and Afrikaans share of any metro. Western Cape province: Afrikaans 41.2%. [SEARCH, confirmed against Stats SA report text in two searches] https://www.statssa.gov.za/publications/03-01-84/03-01-84.pdf
- eThekwini (Durban): isiZulu 65.6%, English 28.6%. KwaZulu-Natal: isiZulu 80%. [SEARCH] https://southafricafacts.co.za/south-africa-languages-census-2022/ , https://www.statssa.gov.za/publications/Report-03-01-74/Report-03-01-742022.pdf
- Johannesburg: isiZulu 28.9%, English 13.7%, Sesotho 11.9% [SEARCH, one secondary site]. Gauteng: isiZulu 23.1%, and no language reaches a quarter of the province. [SEARCH] https://www.statssa.gov.za/publications/Report-03-01-76/Report-03-01-762022.pdf
- Nelson Mandela Bay (Gqeberha): isiXhosa 59.5% [SEARCH, secondary]. In 2011: isiXhosa 57.3%, Afrikaans 29.7%, English 12.1%. https://en.wikipedia.org/wiki/Nelson_Mandela_Bay_Metropolitan_Municipality
- Tshwane (Sepedi about 24%) and Mangaung (Sesotho; Free State is over 70% Sesotho): exact metro figures [UNVERIFIED].
- Verdict: isiXhosa is the right third language for Cape Town and Gqeberha only. For Durban and Johannesburg it is isiZulu; for Pretoria and Bloemfontein it is Sepedi, Setswana or Sesotho. A national promise needs isiZulu first.
- Code-switching is the norm, not the exception: SA speech researchers say the multilingual population "commonly mix" languages in casual talk, usually English plus one African language. [SEARCH] https://arxiv.org/pdf/1807.10949 . WhichVoIP: "Mid-call switches between English, isiZulu, Afrikaans and Sesotho still trip them up, even on local platforms." [READ]
- The local market leader cannot do it yet. Untapped AI (Cape Town, claims 5,000+ live agents) supports English and Afrikaans only; when a caller switches to an African language "the agent asks them to continue in English or Afrikaans". TechCentral, 11 June 2026. [READ] https://techcentral.co.za/lost-in-translation-why-ai-voice-agents-fail-south-africans/282607/ . Busy Board (Durban) lists isiZulu and Afrikaans as "coming". [READ, WhichVoIP]

#### 4. Tools and habits
- WhatsApp: about 96% of SA internet users, roughly 29 million phones. [READ] https://whichvoip.co.za/voip/mobile-voip-apps-vs-whatsapp-calling-which-is-best-for-your-business/
- Standard Bank Township Informal Economy Report (Oct 2025): 74% of township SMEs prefer WhatsApp to reach customers, Instagram 47%. "WhatsApp is the go-to tool for its ease and low cost." [SEARCH] https://www.businessday.co.za/bt/business-and-economy/2025-10-19-whatsapps-the-top-tool-for-township-businesses/
- MEF Consumer Survey 2026: to start contact with a company, South Africans pick email 70%, WhatsApp 40%, phone 36%. [SEARCH] https://mobileecosystemforum.com/2026/09/18/mef-data-email-still-rules-in-south-africa-for-mobile-communications-with-brands/
- Vodacom's CEO (May 2026): voice is "not dissimilar to what we went through with SMS". TechCentral adds that South Africans "increasingly think of 'making a call' as sending a voice note in WhatsApp". [READ] https://techcentral.co.za/voice-going-the-way-of-sms-says-vodacom-ceo/281242/
- But people still phone: ICASA counted 88.6 billion mobile voice minutes in the year to Sep 2025, up 21.5%. Revenue fell, minutes did not. [READ] https://techcentral.co.za/whatsapp-is-eating-south-african-operators-revenue/279776/
- Yoco: 200,000+ independent businesses active in 12 months; top sectors food and drink, retail, health and beauty. [READ] https://www.yoco.com/za/blog/beyond-growth-uncovering-the-data/ . Yoco says the average SA small business juggles "eight or more disconnected apps", and launched its own AI business agent in June 2026. [SEARCH] https://www.ewn.co.za/2026/06/24/yoco-enables-small-business-growth-with-over-20-new-products-including-its-first-ai-agent
- Mobile-only owners: a WhatsApp number is "a mobile number registered to one handset and one person"; missed calls "simply sit there as a missed call on one person's phone". [READ, WhichVoIP]

#### 5. Trust
- 2026 SA Customer Experience Report (2,000 consumers): 85% say it matters that a company tells them when they are talking to AI. [SEARCH] https://www.bizcommunity.com/article/south-africans-are-open-to-ai-but-still-expect-access-to-a-person-631291a . About half would let AI book travel "or even medical appointments". [READ] https://www.itweb.co.za/article/ai-search-firmly-part-of-customer-experience/P3gQ2qGAzQm7nRD1
- Untapped AI's CEO: "the drop-off rate is significantly higher when customers encounter robotic or foreign accents." [READ, vendor's own call-centre data] TechCentral URL above.
- Latency: 1Stream's CEO puts the comfort zone near 400ms; slower than 700ms and "the customer knows they are talking to a machine". Overseas routing makes it worse. [READ] same URL
- Spam fear: Truecaller counted 17.47 billion spam calls in SA in H1 2026 (up 25.2%); about 3 in 10 unknown calls are spam; only 7.8% of flagged spam calls get answered. [SEARCH] https://www.citizen.co.za/lifestyle/technology/south-africans-block-billions-spam-calls-amid-tougher-consumer-protection-crackdown/ . Small businesses calling from mobiles get wrongly flagged. [READ, Snupit]
- UCT's Jan Buys warns a local-sounding AI voice is also a better fraud tool against elderly people. [READ] TechCentral URL above.
- POPIA: the business is the responsible party; open the call by saying it may be answered and processed by AI and recorded; confirm where audio is processed. [READ, WhichVoIP]
- Customer phrases found: "eventually we ran out of airtime and gave up" (HelloPeter, call-centre callback) [SEARCH] https://www.hellopeter.com/the-plumbers ; a dental receptionist who promised a callback that never came [SEARCH] https://africacomplaints.com/health-medicine/152451-dr-heleen-olivier-unprofessional-service.html
- Older baseline: Merchants survey, 2,000 South Africans, Sept 2020: 62% prefer to speak to a person, 35% a chatbot. Six years old. [READ] https://www.itweb.co.za/article/chatbot-frustration-leads-to-consumers-opting-for-human-interaction/Pero37ZxrALqQb6m

### Surprises and things that contradict the v1 page or the brief
1. Load shedding is a dead pitch. Eskom reported 525 straight days without it on 23 Oct 2026 (none since 16 May 2025). Only about 2.8% of customers still face local "load reduction". [SEARCH] https://allafrica.com/stories/202610050125.html
2. "isiXhosa" is a Cape Town claim, not a South African one, and the best-funded local rival does not ship it. Claiming it on a stack whose docs do not list it is the biggest credibility risk on the page.
3. The problem runs both ways. Customers now ignore unknown numbers, so any "we will call you back" promise is weak. Confirmations must go by WhatsApp or SMS.
4. The independent SA buyer's guide tells owners not to buy a receptionist replacement: "any vendor pitching the AI as a wholesale receptionist replacement is selling the demo". It recommends after-hours and overflow first. [READ]
5. v1's price is not the problem. Published SA plans run R849 to R7,500 a month; Busy Board is R1,899 for 300 minutes then R10 a minute. R1,999 for 400 minutes and R3 overage is competitive. [READ, WhichVoIP, prices checked 27 Oct 2026]
6. Phone is only the third-choice channel for starting contact (36%), behind email and WhatsApp.
7. NightsBridge disclosed a breach it attributes to an AI agent, with scammers already using the data. Guesthouse owners may be wary of "AI" right now. [SEARCH] https://mybroadband.co.za/news/security/676082-ai-agent-believed-to-have-breached-south-african-platform-that-handles-bookings-for-10000-hotels-guesthouses-lodges-and-bbs.html

### What this means for v2
1. Reposition from "AI receptionist" to "the calls you miss": after hours, lunch, when you are with a client or under a sink. Keep the human. (Findings 1, 2; surprise 4.)
2. Make WhatsApp the visible output of every call. The story of a call should end with a WhatsApp message on the owner's phone (who called, what they want, booking made) and a confirmation to the caller. This is the SA feel v1 lacks. (Finding 4.)
3. Say it is an AI in the first sentence and offer a person at any time ("say 'person' and I will put you through to Thabo's cell"). Show that script on the page. (Finding 5: 85%.)
4. Languages: promise only what has been tested with real speakers. Lead with South African English and Afrikaans. Offer isiXhosa for Cape Town and isiZulu for Durban and Joburg as "in testing, falls back to a human" until proven. Let the page show the language mix per city. (Finding 3.)
5. Drop load shedding. Drop "62%". Replace with a free 14-day missed-call count on the owner's own line, so the number is theirs. (Finding 1; surprise 1.)
6. Use a local 021, 011 or 031 number and a recorded-sounding SA voice; state where calls are processed. (Finding 5.)
7. First segments, in order: (a) solo trades in Cape Town, (b) dentists, physios and GPs with an existing calendar, (c) salons, (d) guesthouses via NightsBridge. One page section each, with that trade's actual caller questions.
8. Offer a 30-day pilot on one number with one metric: recovered calls. (WhichVoIP pilot pattern.)

### Could not verify / gaps
- No direct access to HelloPeter, Reddit, MyBroadband forums or Google reviews, so real owner and customer quotes are thin. This needs ten phone interviews by the Cape Town partner.
- Census 2022 metro figures for Johannesburg, Tshwane, Nelson Mandela Bay and Mangaung come from one secondary site or are missing; check Stats SA Report 03-01-84, Table 2.2.
- No data on when missed calls happen in a small SA practice's day, or what callers ask, beyond vendor claims.
- Mobile call-forwarding costs on Vodacom, MTN, Telkom and Cell C not found. Only a roughly 2010 forum post saying the forwarding owner pays the forwarded leg. Test on each network before promising "keep your number".
- No market-share data for Fresha, Booksy, GoodX, Healthbridge, Med-e-Mass, Dentally, Vagaro or SimplyBook in SA.
- "South Africans send the most voice notes per capita" is unsourced marketing.
- Share of small businesses with no landline: no figure. ICASA fixed-line voice revenue fell 11.8% in the year to Sep 2025. [READ, TechCentral]


## Thread 4: Voices and the tech that decides


Researched 13 November 2026. Tags: [READ] = I fetched the page, [SEARCH] = search summary only, [UNVERIFIED] = vendor claim or not confirmed. Rand figures use R16.40 per US dollar ([SEARCH], x-rates snapshot of 10 Nov 2026, https://www.x-rates.com/calculator/?from=ZAR&to=USD).

### Findings

#### 1. Speech-to-speech models (one model hears and speaks)

- **Grok Voice 3.0 is now the top-ranked model and still $0.08/min.** xAI pricing page: "Speech to Speech (grok-voice-3.0) $0.08 / min", 2.0 deprecated. [READ] https://docs.x.ai/docs/models.md . Artificial Analysis leaderboard (read today): Grok Voice 3.0 index 86.9 (first), agentic 71.6%, live-call task success 94.8% (first), interruption handling 97.0%, 0.81 s to first audio. [READ] https://artificialanalysis.ai/speech-to-speech
- **Its language list has not changed.** 20 languages; no Afrikaans, isiZulu or isiXhosa. Others work "with varying degrees of accuracy". The separate transcription model lists 38 languages including Dutch, still none of the three. [READ] https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech.md and .../speech-to-text.md
- **xAI now has its own SIP phone-call entry point.** You register a number you own ("byo_trunk") and point any carrier at `sip:{number}@sip.voice.x.ai`; docs give steps for Twilio, Telnyx, Plivo, Bandwidth and "Bring Your Own SIP Provider". Transfers (`refer`), hangup and keypad tones are built in. xAI does not sell numbers. [READ] https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech/sip.md
- **No regional hosting for voice.** The global endpoint's "processing location is not guaranteed"; the US endpoint serves no voice APIs. [READ] https://docs.x.ai/developers/advanced-api-usage/regions.md
- **OpenAI:** leaderboard shows GPT-Live-1 (83.2 and 80.1) and GPT-Realtime-2.1 High (75.2; $10.75 per hour of input audio, about $0.18/min). [READ] same leaderboard. Token prices $32 in / $64 out per 1M audio tokens. [SEARCH] https://www.forasoft.com/blog/article/openai-realtime-api-pricing
- **Google Gemini 3.8 Live:** index 74.5 (82.6 with extended thinking), highest listener preference (Elo 1074), 93.2% task success, cheapest at $0.84 per hour of input audio. [READ] same leaderboard. The capabilities page reportedly lists Afrikaans and Zulu among 99 languages; Xhosa not confirmed; about $0.005/min in and $0.018/min out. [SEARCH] https://ai.google.dev/gemini-api/docs/live-api/capabilities (host blocked in this session, so not read first-hand).
- **ElevenLabs Realtime v1 Max:** index 77.3, fastest of the strong models at 0.57 s. [READ] same leaderboard.
- **Every one of these benchmarks is English, on clean audio.** A reviewer's caveat: "Benchmarks run on clean audio and tidy scenarios, while your callers are on speakerphone in a car." [READ] https://www.eesel.ai/blog/grok-voice-3-review (15 Oct 2026)

#### 2. Pipeline stacks and official language support

- **ElevenLabs Agents:** $0.08 per extra minute, LLM billed on top, telephony at cost; Pro plan $99/month includes 1,238 minutes. [READ] https://elevenlabs.io/pricing/agents
- **ElevenLabs is the only vendor that publishes accuracy tiers, and they are sobering.** Afrikaans sits in "Good (>10% to ≤20% WER)". Xhosa and Zulu sit in "Moderate (>25% to ≤50% WER)", meaning a quarter to half of words wrong. [READ] https://elevenlabs.io/docs/overview/capabilities/speech-to-text.md
- **ElevenLabs voices:** v4 and v4 Turbo list Afrikaans and Zulu; v3 lists Afrikaans only; Flash v2.5 and Multilingual v2 list neither. No model lists Xhosa, and the Xhosa text-to-speech page returns 404. [READ] https://elevenlabs.io/docs/overview/models.md
- **Azure:** af-ZA and zu-ZA speech recognition, two neural voices each (Adri, Willem; Thando, Themba). No xh-ZA found. [SEARCH] https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- **Google Cloud:** Chirp 3 recognition lists af-ZA, xh-ZA, zu-ZA, each marked Preview; for voices only an Afrikaans Standard voice was found. [SEARCH] https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3
- **Deepgram** added Afrikaans to Nova-3 in August 2026 (no Zulu or Xhosa found). **AssemblyAI** streaming lists Afrikaans, Xhosa and Zulu at $0.45/hour. **Cartesia**: not confirmed. [SEARCH] https://developers.deepgram.com/changelog/2026/8/17 , https://www.assemblyai.com/blog/real-time-transcription-code-switches-multilingual-speakers
- **Open-source reality check.** AfriVox-v2 (May 2026, unscripted African audio): word error rate for isiXhosa is 20 to 34% and isiZulu 20 to 26% across Meta Omnilingual 7B, Gemini 3 Flash and Intron Sahara-v2; the best model still scores 31% on isiXhosa and 27% on isiZulu in the telecom domain. Note the authors work at Intron, which makes Sahara. [READ] https://arxiv.org/html/2605.03590
- University of Pretoria and Lelapa researchers (30 Jun 2026): Whisper and MMS give "zero-shot WER above 100%" on Southern Bantu languages; after fine-tuning, isiZulu reaches 24.8% and isiXhosa 26.1%. [READ] https://arxiv.org/abs/2606.31642
- Stellenbosch: isiXhosa "is under-represented in the Whisper model". [READ] https://arxiv.org/abs/2501.06478 . Code-switching between English and isiZulu or isiXhosa has been a named research problem since 2018. [READ] https://arxiv.org/abs/1807.10949

#### 3. South African specialists

- **Lelapa AI (Vulavula)** sells transcription and translation for contact-centre analytics, real-time and batch, from $9.99/month. No text-to-speech product on the site. [READ] https://lelapa.ai/ , https://lelapa.ai/pricing . Its CEO told ITWeb voice generation is still to be added. [SEARCH] https://www.itweb.co.za/article/itweb-tv-lelapa-ai-eyes-faster-ambitious-growth/VgZeyvJlpbXMdjX9
- **Untapped AI**, the best-funded local player with its own GPUs and call exchange, "currently supports English and Afrikaans, with isiZulu and isiXhosa in development. For now, when a caller switches to an African language, the agent asks them to continue in English or Afrikaans." [READ] https://techcentral.co.za/lost-in-translation-why-ai-voice-agents-fail-south-africans/282607/ (11 Jun 2026)
- **Botlhale AI** lists recognition and speech synthesis for isiZulu and isiXhosa. [SEARCH][UNVERIFIED] https://botlhale.ai/speech-apis/ (host blocked; no independent quality data found).
- UCT's Jan Buys: buyers should press vendors on "what language support actually means and how it can be verified". [READ] TechCentral link above.

#### 4. Managed platforms

- **Retell:** $0.055 voice infrastructure + LLM + voice; its calculator shows $0.11/min before telephony; Grok Voice 3.0 offered at $0.135/min. South Africa is not in its phone-number country list; custom SIP is free. [READ] https://www.retellai.com/pricing
- **Vapi:** $0.05 hosting; own estimate $82 to $129 per 1,000 minutes with Deepgram, OpenAI and ElevenLabs. [READ] https://vapi.ai/pricing
- **Bland:** $0.14/min including LLM, recognition and voice; telephony separate; $0.05 per transferred minute. [READ] https://www.bland.ai/pricing
- **LiveKit Cloud** $0.01 per agent minute plus models; **Ultravox** $0.05/min. [SEARCH] https://www.forasoft.com/blog/article/livekit-ai-agents-guide
- The cost-stacking warning: headline rates cover one of five invoices; real cost lands at "$0.13 to $0.33". Vendor blog, 5 Jul 2026. [READ] https://dev.to/alfredo_romero_fc4afdcb68/why-your-007min-voice-agent-actually-costs-031-the-5-invoice-problem-2ii7
- None of these adds a language the underlying models lack.

#### 5. Telephony and latency

- **Twilio South Africa (pricing "current as of October 2026"):** local number $1.50/month, mobile number $4.00/month; receiving calls $0.0107/min; outbound to SA landlines $0.0362/min and mobiles $0.0499/min. [READ] https://www.twilio.com/en-us/voice/pricing/za
- **Twilio SIP trunk into xAI is cheaper:** inbound $0.0067/min; transfers out $0.0322 (landline) or $0.0459 (mobile) per minute. [READ] https://www.twilio.com/en-us/sip-trunking/pricing/za
- **Paperwork:** a local number needs business registration, a representative's ID, and a business address "within locality or region covered by the phone number's prefix" with proof. Mobile numbers only need an address anywhere in South Africa. [READ] https://www.twilio.com/en-us/guidelines/za/regulatory
- **No African edge.** Twilio lists no Johannesburg location (nearest: Ireland, Frankfurt). [READ] https://www.twilio.com/docs/global-infrastructure/edge-locations . ElevenLabs SIP regions are US, EU, India, Singapore. [READ] https://elevenlabs.io/docs/eleven-agents/phone-numbers/sip-trunking.md . Round trip Johannesburg to London is about 158 ms, to Virginia about 229 ms. [SEARCH] https://hatsnet.io/docs/network/latency/pairs/jnb-lon-rtt
- **Local alternative:** Switch Telecom publishes a 4-channel SIP trunk at about R100/month and numbers at R10 each. [SEARCH] https://www.switchtel.co.za/voip-sip-trunk/ . Whether it can forward to an external SIP address is not confirmed.
- **The "400 ms benchmark"** is a 1Stream press release (5 Jun 2026), not a test. [READ] https://www.itweb.co.za/article/the-400ms-benchmark-why-infrastructure-is-the-real-hurdle-for-sa-ai-bots-to-overcome/KzQenMjyPDe7Zd2r . WhichVoIP's independent guide says a working agent "answers in roughly 800 ms to 1.5 seconds" and "a long international hop chews half that budget". [READ] https://whichvoip.co.za/phone-systems/ai-agent-to-answer-business-calls/

#### 6. What breaks in the real world

- "Mid-call switches between English, isiZulu, Afrikaans and Sesotho still trip them up, even on local platforms." [READ] WhichVoIP link above.
- Untapped's call-centre data: "the drop-off rate is significantly higher when customers encounter robotic or foreign accents." Vendor claim. [READ][UNVERIFIED] TechCentral link above.
- Names and numbers are the weak point: "A voice that says 'Mthatha' or 'Khoza' wrongly undermines the whole interaction." [READ] https://cognexa.co.za/ai-chatbot-south-african-languages.html
- Load shedding has reportedly been absent for about 18 months; outages are now local and unplanned. [SEARCH] https://mybroadband.co.za/news/industrynews/677731-thinking-of-going-off-grid-in-2026-your-south-african-buyers-guide.html

### Comparison table

| Option | Model cost | All-in per minute (USD / rand) | English | Afrikaans | isiZulu | isiXhosa | SA number | Nearest servers |
|---|---|---|---|---|---|---|---|---|
| Grok Voice 3.0 + Twilio SIP (recommended) | $0.08 | $0.09 to $0.12 / R1.50 to R2.00 | Top ranked | Unlisted, test | Unlisted | Unlisted | Twilio, $1.50/mo | Not guaranteed |
| ElevenLabs Agents (fallback) | $0.08 + LLM | $0.10 to $0.13 / R1.65 to R2.15 | Strong | Listed, 10 to 20% errors | Listed, 25 to 50% errors | Hears only, no voice | Bring own | US, EU |
| Gemini 3.8 Live, self-built bridge | about $0.02 | $0.04 to $0.06 / R0.65 to R1.00 | Most liked voice | Listed [SEARCH] | Listed [SEARCH] | Not confirmed | Bring own | Not checked |
| OpenAI GPT-Realtime-2.1 | about $0.18 | $0.19 to $0.22 / R3.10 to R3.60 | Strong | Unpublished | Unpublished | Unpublished | Bring own | US, EU [SEARCH] |
| Retell default pipeline | $0.11 | $0.12 to $0.14 / R1.95 to R2.30 | Strong | Depends on parts | Depends | No voice exists | Not sold, SIP only | US |
| Vapi | $0.08 to $0.13 | $0.09 to $0.15 / R1.50 to R2.45 | Strong | Depends | Depends | No voice exists | Bring own | US |
| Bland | $0.14 | $0.15 to $0.17 / R2.45 to R2.80 | Strong | Not checked | Not checked | Not checked | Bring own | US |
| Azure Speech pipeline | varies | not priced | Strong | Hears and speaks | Hears and speaks | Not found | Bring own | South Africa North (transcription) [SEARCH] |
| Lelapa / Botlhale | n/a | not published | n/a | Limited | Hears; Botlhale voice unverified | Botlhale claims | n/a | South Africa |

All-in figures are my arithmetic: model + Twilio inbound ($0.0067 to $0.0107) + allowance for billed silence, transfer legs and hosting.

### Surprises and things that contradict the v1 page or the brief

1. **The isiXhosa claim cannot be supported by anything on the market.** No mainstream vendor sells an isiXhosa voice, the best recognition gets one word in four or five wrong, and the best-resourced local competitor has not shipped it.
2. **Afrikaans is not guaranteed on Grok either.** Unlisted; one typed test is not evidence for phone audio.
3. **The v1 stack choice was right for English.** Grok Voice 3.0 now leads the independent ranking at the same price.
4. **Twilio's programmable-voice layer is now optional.** xAI takes SIP directly, cutting the phone leg from $0.0107 to $0.0067 and removing our media bridge.
5. **The docs now call the company "SpaceXSI"** and Artificial Analysis lists "SpaceXAI". Check the vendor name before printing "xAI" anywhere.
6. **Load shedding is a stale selling point.**
7. **Local numbers need a local address per area code.** One Cape Town address will not cover a Johannesburg 011 number on Twilio.

### What this means for v2

Ranked recommendation:

1. **English + Afrikaans now: Grok Voice 3.0 over a Twilio SA number and SIP trunk.** Pin `grok-voice-3.0`, do not use the `latest` alias (finding 1; eesel review).
2. **Fallback if Afrikaans fails testing: ElevenLabs Agents** with a v4 Turbo voice, the only stack that lists Afrikaans for both hearing and speaking with a published error band.
3. **isiZulu and isiXhosa: remove from the promise.** Say plainly: "English and Afrikaans today. If a caller speaks isiZulu or isiXhosa, we take a message or transfer to you." Offer a waitlist. Pilot isiZulu privately on Gemini 3.8 Live or ElevenLabs v4. Do not date isiXhosa.
4. **Budget $0.10 to $0.12 per minute (R1.65 to R2.00).** 400 included minutes cost about R660 to R800 against R1,999; the R3 overage stays profitable. Transfers to the owner's mobile add about R0.75/min.
5. **Sell a new or ported number, not carrier call-forwarding**, until forwarding costs are confirmed.
6. **Do not claim a response time under one second.** Expect about 1.0 to 1.3 s.

Test with real speakers before any promise goes on the page:
- 20+ calls each from native Afrikaans speakers (Cape and Gauteng accents) and SA English speakers with isiXhosa, isiZulu, Afrikaans and Cape Flats accents, on Vodacom and MTN mobile, in a car and a busy shop.
- Read-back of surnames, street and town names (Mthatha, Gqeberha, Khoza), phone numbers and rand amounts.
- Mid-sentence switching between English and Afrikaans.
- An isiXhosa and isiZulu caller: does it fail gracefully or answer confidently and wrongly?
- Booking tool calls end to end, interruptions, a transfer to a mobile, and measured delay from Cape Town.

### Could not verify / gaps

- ai.google.dev and botlhale.ai were blocked; Gemini language and price facts and Botlhale's claims are search-only.
- Azure and Google language tables are search-only; "no xh-ZA on Azure" needs a direct read.
- Where xAI voice actually runs, and real delay from South Africa: untested.
- Mobile-operator call-forwarding charges: no current official source found.
- Telnyx, Vonage, Plivo SA inbound rates and Euphoria, Telviva, BitCo pricing: not confirmed. Plivo's pages conflict.
- Retell's Grok price ($0.135) may or may not include its $0.055 infrastructure fee.
- "CMT Voice Cloud" (11 languages) exists only as one X post. [UNVERIFIED] https://x.com/Father_Of_Geeks/status/2087891942763844039
- No independent test of any speech-to-speech model in Afrikaans, isiZulu or isiXhosa exists. Our own test would be the first evidence.


## Thread 5: Price and what to offer


Researched 13 November 2026. Exchange rate used: R16.50 per US$1 (closes of R16.38 on 9 Nov and R16.53 on 10 Nov 2026, [SEARCH] https://www.exchangerates.org.uk/USD-ZAR-exchange-rate-history.html ; 52-week range R15.63 to R18.36, [SEARCH] https://pluang.com/en/tools/currency-converter/usd-zar).

Verdict in one line: R1,999 a month is a fair price for the right customer, but the offer is wrong in structure. The R2,500 setup fee, the missing entry plan, the missing trial, and the "minutes" language are the problems, not the monthly number.

### Findings

#### 1. Global prices (all read on vendor pages today unless tagged)

| Vendor | Plan and unit | Rand | Books and transfers? | Trial / setup |
|---|---|---|---|---|
| Rosie | $49, 250 min | R809 | No. Booking on calendar and transfers start at $149 (1,000 min) = R2,459 | 7-day trial, annual = 2 months free, no setup fee |
| Goodcall | $79 for 100 unique callers ("about 150 calls"); $129 for 500 | R1,304; R2,129 | Yes | Free demo agent, pay when you connect a number |
| Dialzara | $29/60 min; $99/220; $199/500; $349/1,000 | R479; R1,634; R3,284; R5,759 | Calendar sync and warm transfer from $99 | 7-day trial; overage $0.35 to $0.48 = R5.78 to R7.92/min |
| My AI Front Desk | $99, 200 min ($79 annual) | R1,634 | Yes | 7-day trial; overage $0.25 = R4.13/min |
| Smith.ai (human) | $300 for 30 calls | R4,950 | Yes | 30-day money-back, "No setup fees" |

Sources [READ]: https://heyrosie.com/pricing , https://www.goodcall.com/pricing , https://dialzara.com/pricing , https://www.myaifrontdesk.com/pricing , https://smith.ai/pricing

- Three billing units exist: per minute (Rosie, Dialzara, My AI Front Desk, Trillet), per call (Smith.ai AI from $150 for 75 calls, Upfirst, AIRA at $24.95 for 30 calls), per unique caller (Goodcall). Flat unlimited is rare. [READ] https://dupple.com/learn/how-much-does-an-ai-receptionist-cost (4 Nov 2026) and https://www.getaira.io/blog/best-ai-answering-service
- Independent arithmetic at 300 calls of 3 minutes: Goodcall $129, Trillet $199, My AI Front Desk $264, Dialzara $349, Smith.ai AI $500, Smith.ai humans $2,100. Dupple: "Choose the billing unit before the vendor." [READ] same Dupple page.
- Setup fees are not normal on self-serve plans: "Trillet and Dialzara state no setup fees and no contracts". Setup money only appears as managed service (Dialzara "Done for You" from $1,500 a month = R24,750). [READ] Dupple.
- The anti-minute pitch is the loudest counter-position: Goodcall, "We never meter minutes. A thirty-second wrong number and a nine-minute booking cost exactly the same." [READ] goodcall.com/pricing. Vendors who do sell minutes translate them for owners: Goodcall "About 150 calls/month", My AI Front Desk "1 to 10 interactions / day", Dialzara has a calls x talk-time estimator. That is evidence owners do not think in minutes.
- At feature parity (books appointments and transfers calls) global prices land at R1,634 to R2,459. R1,999 for 400 minutes sits in the middle of that band.

#### 2. South African prices

| Provider | Monthly | Included | Per included min | Setup / terms |
|---|---|---|---|---|
| Virtual Receptionist AI Starter | R680 incl. VAT | 60 min | R11.33 | month to month |
| BizAI Voice Valet | R999 ex VAT (R1,149 incl.) | 100 min, EN + AF | R9.99 | R0 self-setup, assisted R850/hour, 14-day trial no card |
| VoiceReceptionist.co.za | R1,199 / R1,999 | 100 / 200 min, hard cap | R11.99 / R10.00 | browser only, no phone number |
| Agent Help | R1,999 ex VAT | 150 min | R13.33 | no setup fee [SEARCH] |
| Remi Lite | R1,900 | 500 min + WhatsApp/SMS, reminders at 48/24/2h, missed-call text-back | R3.80 | no setup fee, 1-week trial, overage R1.85/min |
| AiSky | R2,399 (R1,999 if yearly) | 250 min once-off, then R0.97/min | n/a | R0 setup, 7-day trial with 100 min |
| Le Roux Digital (Cape Town) | R1,450 to R5,450 | not published | n/a | setup R3,950 to R11,950, 3-month minimum |
| Aiployee | R7,500 ex VAT | unlimited, one call at a time | n/a | setup R5,000 |
| **Front Desk AI v1** | **R1,999** | **400 min** | **R5.00** | **setup R2,500, no trial** |

Sources [READ]: https://whichvoip.co.za/compare-ai-voice-agents/ (verified Oct 2026), https://whichvoip.co.za/reviews/virtual-receptionist-review/ (12 Nov 2026), https://whichvoip.co.za/reviews/remi-review/ , https://whichvoip.co.za/reviews/aisky-review/ , https://whichvoip.co.za/reviews/le-roux-digital-review/ , https://www.bizai.co.za/pricing , https://www.voicereceptionist.co.za/ . Agent Help [SEARCH] https://www.agenthelp.co.za/virtual-receptionist-south-africa.html

- WhichVoIP: published rand plans run "R849 to R7,500"; no setup fee at 3 of 8; "How minutes are charged matters more than the headline price." [READ] same compare page.
- Where R1,999 sits: at the top of SA entry prices (R680 to R1,199), but second best on value per minute after Remi. The setup fee is the outlier: only agencies (Le Roux, Aiployee) charge one, and WhichVoIP marks Le Roux down for "the steepest upfront costs in the category".
- SA human answering service: live agents R790 for 200 calls, R1,280 for 400, R2,065 for 700, office hours only, R300 registration. [SEARCH] https://www.virtualreceptionist.co.za/live-receptionist . A human bureau is cheaper than our AI per call. Our edge is 24/7 and booking, not price.

#### 3. What a human receptionist costs

- Indeed: about R7,827/month (635 salaries, 16 Sep 2026); PayScale about R8,845; SalaryExpert about R15,548. [SEARCH] https://za.indeed.com/career/receptionist/salaries , https://www.bbrief.co.za/2026/06/30/receptionist-salary-ranges-employment-guide/ (Indeed blocked my direct read today.)
- National minimum wage R30.23/hour from 1 March 2026. [SEARCH] https://acts.co.za/news/blog/2026/02/national-minimum-wage-adjustments-2026 . Floor for a 45-hour week: 30.23 x 45 x 52 / 12 = R5,895/month.
- On-costs are small: UIF 1%, SDL 1% only if payroll is over R500,000 a year, COIDA about 0.2% to 1%. [SEARCH] https://www.deel.com/blog/employer-costs-for-an-employee-in-south-africa/ . So R7,827 + about 2.5% = about R8,020 before desk, PC and phone.
- The real gap is coverage: 45 of 168 hours a week (27%), and about 37 paid days a year not at the desk (15 leave, about 12 public holidays, up to 10 sick) out of 261 weekdays (14%).
- v1's "R8,000 to R15,000" is defensible. R8,000 is the honest anchor.

#### 4. What a small SA business can afford

- Micro enterprises (0 to 10 staff) are 84% of MSMEs with average turnover about R410,000 a year (R34,000 a month). Small (11 to 50 staff) average R8.3m a year. [SEARCH] OECD citing FinScope MSME 2024, https://www.oecd.org/en/publications/financing-smes-and-entrepreneurs-2026_bb7fc5c4-en/south-africa_f8596abd-en.html
- R1,999 is 5.9% of an average micro business's turnover (1,999 / 34,167). It only makes sense above roughly R150,000 a month turnover (1.3%).
- What they already pay: Yoco R0 / R249 / R499 per location plus about 2.3% card fees [READ] https://www.yoco.com/za/pricing/ ; Xero R485 / R857 / R1,195 from 1 Nov 2026 [SEARCH] https://aiguide.co.za/guides/accounting-software-south-africa ; Booksy R399 + R89 per extra user [SEARCH] https://booksy.com/biz/en-za ; GoodX about R1,200 (one 2023 user report) [SEARCH]; DStv Premium R979 [SEARCH] https://tech.africa/dstv/ ; LekkerAI chat R499 to R4,999 [READ] https://www.lekkerai.co.za/ . R1,999 would be the biggest software line on most small businesses' statements. R999 feels like "Xero Standard".
- Interest is there, money is tight: Amazon Digital Adoption Report 2026 (1,400 SA SMMEs): 13% use AI for customer service, 76% rate interest in affordable AI at 4 or 5 out of 5, recurring costs named as a barrier. [SEARCH] https://it-online.co.za/2026/11/11/sa-smes-go-digital-but-barrier-to-growth-is-operational-support/

#### 5. Value of one booking, and break-even at R1,999

| Industry | SA price point [SEARCH] | Bookings to cover R1,999 |
|---|---|---|
| Dentist exam | R450 to R900 (https://designersmilesinc.co.za/dentist-prices-johannesburg/) | 3 |
| Ladies cut and blow-dry | R350 to R780 (https://www.showsalon.co.za/pages/pricelist) | 4 |
| Physio session | from R550, older source (https://www.expatcapetown.com/south-africa-health.html) | 4 |
| Guesthouse night | R900 to R1,400 (https://www.thesouthafricanguide.com/practical/budget-and-costs/) | 2 nights |
| Minor car service | R1,200 to R3,500 (https://www.e-car.co.za/car-tips/cost-of-servicing-your-car/) | 1 |
| Attorney first consult | R500 to R2,000; R2,000 to R4,000/hour (https://www.ja-attorneys.co.za/how-much-is-a-lawyer-consultation-fee-in-south-africa/) | 1 to 2 |

This is revenue, not profit.

#### 6. Unit economics (read first-hand)

- xAI speech to speech $0.08/min [READ] https://docs.x.ai/docs/models . Twilio SA local number: $0.0107/min inbound + $1.50/month; transfer leg to an SA mobile $0.0499/min [READ] https://www.twilio.com/en-us/voice/pricing/za
- Cost per minute: 0.08 + 0.0107 = $0.0907 = R1.50.
- At 400 minutes: 400 x 0.0907 + 1.50 = $37.78 = R623. Gross margin (1,999 - 623) / 1,999 = 69%. At R18.36 to the dollar the cost is R694 (65%).
- At a realistic 150 minutes: $15.11 = R249, margin 88%. Overage at R3 against R1.50 cost is 50%.
- Call length: vendor data says 59 seconds average over 7,801 calls [SEARCH] https://www.dialora.ai/blog/ai-answering-service-small-business ; comparison sites assume 2.5 to 3 minutes. SA field data: median handed-over call 42 seconds [READ] https://whichvoip.co.za/ai-voice-agent/ai-receptionist-call-data/ . So 400 minutes is roughly 160 to 400 calls. Vendor guides put a single-location business at 150 to 250 calls and 100 to 300 minutes a month [SEARCH, vendor] https://voiceinfra.ai/blog/typical-monthly-ai-voice-agent-minutes-for-small-business-after-hours-receptionists . Most clients will not reach 400.

#### 7. Structure evidence

- Trials: card-required trials convert 48.8% to paid, no-card trials 18.2% (86 SaaS firms, agency sample). [SEARCH] https://userpilot.com/blog/saas-average-conversion-rate/ . SA norm is a 7 to 14 day trial with no card (BizAI, LekkerAI, AiSky, Remi).
- Three tiers versus one plan: no controlled evidence found. One test showed +14% conversion but -8% revenue per visitor; the decoy effect is contested. [SEARCH] https://atticusli.com/replication-crisis/decoy-effect-asymmetric-dominance/
- Setup fees: no empirical study found, only opinion.
- Pay per booked appointment: one small vendor (LeadsNow.ai), no major platform. [SEARCH] https://zian.ai/ai-receptionist-cost-small-business/
- Annual discount: "2 months free" is standard (Rosie, AiSky, LekkerAI 17%, My AI Front Desk 20%). BizAI refuses annual plans.
- Reminders work: Cochrane review of 8 trials, attendance 67.8% with no reminder against 78.6% with SMS. [SEARCH, secondary] https://avaritcall.com/en/blog/appointment-reminder-calls-no-show-research
- Message costs: WhatsApp utility template in SA $0.0095 (Meta card of 1 Oct 2026) [SEARCH] https://formbeep.com/whatsapp-api-pricing/ plus Twilio $0.005 [READ] https://www.twilio.com/en-us/whatsapp/pricing = $0.0145 = R0.24. Twilio SMS to SA is $0.1355 = R2.24 [READ] https://www.twilio.com/en-us/sms/pricing/za . Local SMS retail 38c [READ] bizai.co.za/pricing. WhatsApp reaches about 94% of SA internet users [SEARCH] https://itweb.africa/article/whatsapp-dominates-south-africas-instant-messaging-market/mQwkoq6KxdRv3r9A

### Surprises and things that contradict the v1 page or the brief

1. "One recovered booking a month pays for it" is false for half our target industries. A salon needs 4, a physio 4, a dentist 3.
2. A live SA deployment resolved only 37.8% of 2,151 engaged calls alone; 51.2% were handed to a person; 392 of 2,544 callers (15%) hung up during the greeting. [READ] whichvoip call-data page, Sept 2026. v1 must not imply it replaces a receptionist, and any per-call billing must not charge for hang-ups.
3. Remi already sells our offer for less: R1,900, 500 minutes, WhatsApp, reminders, no setup fee, free week.
4. The brief's SA numbers are stale. VoiceReceptionist.co.za is now R1,199 / R1,999 for 100 / 200 minutes and is browser-only with no phone line. BizAI no longer publishes R3.50/min overage ("Need more than 100 minutes? Talk to us").
5. Rosie's "$49" plan does not book on a calendar or transfer calls. That starts at $149.
6. Twilio SMS into South Africa costs about nine times a WhatsApp utility message. Never send reminders by Twilio SMS.
7. R3 overage is lower than the R5.00 effective rate of the included minutes, so the plan is really a platform fee. Selling it as minutes undersells it.
8. The popular "85% of callers never call back" and "62% of calls go unanswered" figures trace to vendor marketing and an 85-business 2016 study. [SEARCH] https://getsawy.com/statistics/missed-call-statistics . Do not use them.

### What this means for v2: the recommended offer

**After Hours, R999 a month.** Answers when you are closed or do not pick up within 3 rings. Up to 100 calls a month (150 minutes fair use). Takes messages, books, sends you a WhatsApp summary of every call.
Cost: 150 x 0.0907 + 1.50 = $15.11 = R249, plus 60 WhatsApp messages x R0.24 = R14. Total R263. Margin 74%. Matches the SA entry price (BizAI R999 for 100 min) with 50% more time.

**Front Desk, R1,999 a month** (the plan to feature). Every call, day and night. Up to 250 calls a month (500 minutes fair use, matching Remi). Bookings into the calendar, WhatsApp confirmation and reminder to the customer, urgent calls transferred, missed-call text-back, a monthly report in rand.
Cost at the cap: 500 x 0.0907 + 1.50 = $46.85 = R773, plus 450 messages x R0.24 = R108. Total R881. Margin 56%. At a typical 200 minutes: R324 + R36 = R360, margin 82%.

**Multi-branch, from R3,999 a month.** Up to 3 numbers and calendars, 1,000 minutes.
Cost at the cap: 1,000 x 0.0907 + 4.50 = $95.20 = R1,571, plus R215 messages. Margin 55%.

- **Setup fee: R0.** Show it as "Done-for-you setup in 48 hours, included (normally R2,500)". BizAI charges R850 an hour for assisted setup, so three hours is a defensible value. Evidence: findings 1 and 2.
- **Trial: 14 days free on the client's real number by call forwarding, no card, capped at 100 minutes** (worst case cost R150). Then month to month, 30 days' notice. Evidence: SA norm in finding 2.
- **Extra usage: R2.50 a minute, WhatsApp warning at 80%, never cut off, spam and hang-ups under 10 seconds not counted.** Evidence: surprise 2, Goodcall, BizAI's 80% notice.
- **Sell calls, not minutes.** Headline "up to 250 calls", minutes in the small print.
- **No annual plan at launch.** No reviews yet; add "2 months free" once there are case studies.
- **State the VAT position** on the page. Competitors differ and it moves the comparison by 15%.
- **Replace the comparison anchor.** Keep the R8,000 receptionist line, add the coverage fact (27% of the week), and say plainly that the AI hands hard calls to a person.

**The sentence:** "R67 a day, and one extra booking a week pays for it."
Arithmetic: 1,999 / 30 = R66.63 a day. 1,999 / 4.33 weeks = R462 a week. One booking a week covers it for a dentist exam (R450 to R900), a physio session (R550), a guesthouse night (R900+), a car service (R1,200+), a legal consult (R500+) and a mid-range cut and blow-dry (R350 to R780). For After Hours: R33 a day, one booking a fortnight.

### Could not verify / gaps

- No Stats SA or FinScope distribution of monthly turnover was readable; the micro average comes via an OECD table. Yoco publishes no average merchant turnover.
- No independent data on minutes used per small business per month; all figures are vendor-sourced.
- No controlled study on setup fees, three tiers versus one, or money-back guarantees. The setup-fee advice rests on competitor practice.
- Indeed, Meta's rate card, Fresha, GoodX, Agent Help, Remi's own site and all price-point pages in finding 5 were search summaries, not first-hand reads. The dentist, salon and physio prices are single-practice or guide figures.
- No SA no-show rate found. No 2026 survey of how SA customers prefer to reach a business.
- I did not check whether the founders are VAT-registered or whether Twilio's SA numbers need local regulatory documents; both affect the margin and the launch.
- xAI's $0.08 is assumed to cover the whole conversation. LLM tool calls, call recording ($0.0025/min) and transfer legs would add a few cents a minute.


## Thread 6: Design, movement and a South African feel


Researched 13 Nov 2026. Tags: [READ] fetched and inspected by me, [SEARCH] search summary only, [UNVERIFIED] my own knowledge or vendor claim, not confirmed this session. Blocked hosts (web.dev, stripe.com, linear.app, awwwards.com, 10and5.com and most others) could not be opened, so anything about them is [SEARCH] or [UNVERIFIED].

### Findings

#### 1. What v1 actually is (source inspection)
- v1 hero is a stock sky photo (`img/hero-sky-1600.webp`, alt "Bright blue sky with white clouds"), the closing CTA is "Green hills under a blue sky", and the four example photos are empty interiors with no people (alts: "A bright, clean dental treatment room", "A neat guesthouse bedroom with a made bed"). Nothing in any image is identifiably South African. [READ] https://hamzaali.ca/frontdesk-ai/
- The whole stylesheet has four keyframes (`drift`, `live-ring`, `panel-in`, `spin`). Fonts are Poppins and Nunito Sans. Icons are about 60 rounded 2.25px stroke line icons inside tinted badges (`icon-badge icon-sun/sky/leaf`). [READ] https://hamzaali.ca/frontdesk-ai/assets/app.css
- The call story does exist, but as three static rows in the hero card ("Missed call answered 19:02", "Appointment booked", "Message sent to you"). It is stated, not shown. [READ] same page
- Time format is inconsistent: hero uses "19:02" and "10:00", the examples use "7pm", "10am", "6:50am". Prices use a comma ("R1,999"). [READ] same page

#### 2. How competitors show a call (HTML of 11 home pages inspected)
| Site | What moves | Mechanism to steal |
|---|---|---|
| Goodcall | Autoplaying hero: setup chat, then a call transcript line by line, then "Booked, in your calendar" with a Mon to Sun strip where "Wed 2 pm" fills in, then two phones: "Customer's phone: Appointment confirmed" and "Your team's phone: Booking received". | Plain HTML, CSS keyframes (`ring`, `level`, `mv-arrive`, `mv-settle`, `nm-beat`) and a small script toggling `.on` classes. No animation library. A "Pause animation" button. A `.site.js` gate so that without JavaScript every step is simply visible. HTML is 110 KB. [READ] https://www.goodcall.com |
| Bland | Call flow panels | CSS only: keyframes named `hpv6-call-from`, `hpv6-call-via`, `hpv6-call-to`, `live-call-pulse`; 56 `prefers-reduced-motion` references. [READ] https://www.bland.ai |
| Retell | Hero "Get a call from Selina" form plus animated feature tiles | Rive files (`build.riv`, `analyze.riv`, `improve.riv`), GSAP 3.15.0 with ScrollTrigger, six 720p MP4s. 544 KB HTML. Heavy. [READ] https://www.retellai.com |
| Arini | Looping clouds video behind the hero, floating message cards, one real call recording MP3 | GSAP 3.12.2 with ScrollTrigger. Note the clouds: v1's sky photo is already a category cliche. [READ] https://www.arini.ai |
| Aira | Five numbered steps ("Customer calls", "Phone rings while staff is busy", "Voicemail creates a delay", "They call your competitor", "Aira answers instead") and an "Agents handling this call" list with NOW, Next, Queued states | Tell the missed call as a sequence with a status column. [READ] https://www.getaira.io |
| Frontdesk | Muted looping background video with `preload="none"` and a poster, plus a Vimeo demo | The poster plus `preload="none"` pattern is the right way to do video on expensive data. [READ] https://www.myaifrontdesk.com |
| Vapi, CallSphere | "Start call" in the browser, "Tap me to talk" | The demo is the hero. [READ] https://vapi.ai , https://callsphere.ai |
| Rosie, Dialzara | Almost nothing moves. Rosie has four audio samples, Dialzara a phone number card. Rosie's HTML alone is 1.05 MB. | Proof that the market leader on price does not win on motion. [READ] https://heyrosie.com , https://dialzara.com |
- None of the 11 pages had `animation-timeline` or `view-transition` in served HTML (external CSS not checked). [READ]

#### 3. Techniques: use, cost, accessibility, build step
| Technique | Good for | Cost on a cheap Android | Reduced motion | Build step |
|---|---|---|---|---|
| CSS keyframes plus class toggles | Staged sequences (Goodcall) | Near zero if only `transform` and `opacity` | One media query | No |
| CSS scroll-driven (`animation-timeline: scroll()/view()`) | Reveals, sticky scrubbing | Runs off the main thread | Gate with `@supports` and `prefers-reduced-motion: no-preference`; base state must be the visible state | No |
| SVG path animation | Call route lines, ticks, waveform | Tiny | Show final state | No |
| GSAP ScrollTrigger | Complex pinned timelines | Roughly 25 to 45 KB gzipped [UNVERIFIED] plus main-thread scroll work | Manual | No (CDN) |
| Motion (motion.dev) | Springy UI, `scroll()` | MIT; vendor says mini `animate` 2.6 kB, full 18 kB [SEARCH] https://motion.dev/docs/feature-comparison | Manual | No |
| Lottie / dotLottie | Designer-made character animation | dotlottie-web is 34.6 KB gzipped plus a WASM engine of about 500 KB fetched on first use [SEARCH] https://unpkg.com/@lottiefiles/dotlottie-web@0.81.0/README.md | Manual | No |
| Rive | Interactive state machines | Files about a tenth of Lottie (vendor claim) but needs a WASM runtime [SEARCH] https://rive.app/blog/rive-as-a-lottie-alternative | Manual | No |
| Lenis smooth scroll | Agency showpieces | Thoughtworks flags accessibility issues; common advice is to disable it on touch [SEARCH] https://thoughtworks.com/radar/languages-and-frameworks/lenis | Must disable | No |
| Canvas or WebGL | One wow moment | Worst on low-end GPUs and battery [UNVERIFIED] | Replace with image | Usually |
| Short looping video | Real footage | Data cost; use poster and `preload="none"` | Do not autoplay | No |
| View Transitions | Page to page polish | Free | Automatic fallback | No |
- Scroll-driven animations: Chrome 115 (July 2023), Safari 26 (September 2025); Firefox was still behind a flag in May 2026. [READ, post dated 24 May 2026, edited 1 Nov 2026] https://dev.to/raxxostudios/css-scroll-driven-animations-6-patterns-i-ship-in-2026-4bm6 . A web.dev roundup dated 29 Oct 2026 reportedly says Firefox 159 turns it on and the feature is Baseline. [SEARCH] https://web.dev/blog/web-platform-10-2026
- Firefox hardly matters here: SA mobile browsers are Chrome 68.96%, Safari 17.41%, Samsung Internet 7.31%, Opera 4.18%, Firefox 1.06% (Aug 2026). [SEARCH] https://gs.statcounter.com/browser-market-share/mobile/south-africa . The real gaps are iPhones not yet on Safari 26 and Opera.
- GSAP and every plugin are free, including for commercial use, under a "no charge" licence dated 30 April 2025. It is not open source and Webflow can revise the terms. [SEARCH] https://gsap.com/community/standard-license/ , https://webflow.com/blog/gsap-becomes-free
- View Transitions: same-document is Baseline since Firefox 144 (14 Oct 2025); cross-document works in Chrome 126+ and Safari 18.2+, not Firefox. [SEARCH] https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available , https://caniuse.com/cross-document-view-transitions

#### 4. The SA device and network reality
- Android 81.78%, iOS 18.21%; Samsung 50.17% of mobile traffic (Oct 2026). [SEARCH] https://gs.statcounter.com/os-market-share/mobile/south-africa
- Median mobile download speed was 65.7 Mbps at end 2025, 64th in the world. [READ, 9 Feb 2026] https://www.itweb.co.za/article/sa-remains-regional-outlier-for-mobile-download-speeds/rxP3jqBEzGjMA2ye
- 1 GB of prepaid data from the big operators runs about R80 to R160. [SEARCH] https://www.icasa.org.za/uploads/files/2025-26FY-Q2-Bi-annual-Tariff-Analysis-Report-Abridged-Report-For-Publication.pdf
- Typical sub-R2,000 phones: Samsung Galaxy A06 64GB at R1,999, Honor X5 Plus 4GB/64GB at R1,499. [SEARCH] https://pricesinsouthafrica.co.za/best-smartphones-under-r2000-in-south-africa-2026-edition/

#### 5. What makes SA brands feel local
- Yoco: Sharp Grotesk headings with Open Sans; electric blue `#00a9e0` held in place by orange `#fc4c02`, amber `#ffa400`, deep green `#024638` and cream `#fff6e5`; hardware named "Khumo"; "250 000+ businesses" written with a space; real named merchants ("Teddy, Smoothie on the Go", "Catherine, The Hideaway"); a product shot with "a flat white selected". [READ] https://www.yoco.com/za/
- Yoco's own account of its refresh: customers found the old palette "too safe and European"; principles are "bold, human, and African"; an earthy palette was added around the blue; done in-house by Elton Dick. [SEARCH] https://www.yoco.com/za/blog/?p=18236 (the URL redirected to the blog index when I fetched it)
- Nando's had sign-writer Marks Salimu hand-paint letterforms on wood and digitised them as "Nando's Hand"; patterns were commissioned locally. [SEARCH, Jan 2016] https://www.designweek.co.uk/issues/18-24-january-2016/nandos-global-rebrand-looks-to-re-connect-with-south-african-roots/
- Karabo Poppy built her style from "the beautifully hand-painted signage of the old school barbershops". [SEARCH, Feb 2020] https://itsnicethat.com/features/ones-to-watch-2020-karabo-poppy-moletsane-illustration-240220
- Tshepo Mas (Parys, Free State) draws township life in bright complementary colours and now does brand work. [SEARCH, about Mar 2026] https://10and5.com/tshepo-mas-on-turning-township-stories-into-brand-work/
- Tiger Brands had spaza walls hand-painted using "simple, modular forms" and a minimal palette so muralists could reproduce them. [SEARCH] https://nikkimeier.co.za/tiger-brands-spaza-shop-murals
- Checkers Sixty60 rides on one asset, the teal delivery box. [SEARCH] https://africanmarketingconfederation.org/popular-sa-grocery-home-delivery-service-enhances-brand-through-toys/
- Humour (Chicken Licken, King Price, Nando's) works through "the relatability of the circumstances that they satirise". [SEARCH] https://www.bizcommunity.com/article/liezel-malherbe-why-humour-is-a-south-african-marketers-secret-weapon-064425a
- Type: I found no active SA commercial foundry worth building on; the list is mostly defunct or novelty. [SEARCH] https://luc.devroye.org/southafrica.html . isiXhosa needs no diacritics [SEARCH] https://en.wikipedia.org/wiki/South_African_braille ; Afrikaans needs ê, ë, ï, ô, û and ŉ, so check any font for those [UNVERIFIED].

#### 6. Imagery, legally
- Nappy: CC0, no attribution. [SEARCH] https://nappy.co/license . Iwaria: free, CC0, African contributors. [SEARCH, 2018] https://techpoint.africa/2018/11/28/iwaria-feature/ . Picha Stock: paid royalty-free, Afrocentric, Seattle based. [SEARCH, 2021] https://itsnicethat.com/news/picha-stock-afrofemme-photography-190321 . Pexels has SA street photographers, for example https://www.pexels.com/@visualkevv/ [SEARCH].
- Free platforms do not verify model releases, and commercial use of a recognisable person is where the risk sits. [SEARCH] https://licenseorg.com/blog/free-stock-photos-licensing-traps
- SA illustrators: Upwork shows $16 to $35 an hour (Oct 2026); Dribbble listings start near $500 a project and reach $1,500 to $5,000. No rand price per spot illustration was found. [SEARCH] https://www.upwork.com/hire/illustrators/za/ , https://dribbble.com/freelance-illustrators-for-hire-south-africa

#### 7. What reads as "AI template" in 2026
- Named tells: blue-to-purple gradient, Inter in one weight, three feature cards in a row, bento grids, glow blobs, a pill badge above a centred hero, Lucide icons. [SEARCH] https://www.925studios.co/blog/ai-slop-design-tells , https://dev.to/laurilllll/is-your-website-ai-slop-how-to-tell-and-how-to-fix-it-1fn5
- v1 has three of them: the pill badge over the hero, six feature cards, and Lucide-style icons in tinted circles. [READ]
- Lordicon's free animated icons need a visible credit line. [SEARCH] https://lordicon.com/docs/license/free . Stock animated icons are the same generic icons, moving.

### Surprises and things that contradict the v1 page or the brief
1. The best call visualisation in the category (Goodcall) uses no animation library at all. Motion is a staging problem, not a tooling problem.
2. "Slow SA connection" is the wrong constraint. Median mobile speed is 65.7 Mbps. The constraints are data price and weak phone CPUs, which argues against WASM runtimes and video, not against motion.
3. v1 does tell the call story, in three static rows. The gap is staging and sequence.
4. Scrollytelling guides warn it is a poor fit for high-intent landing pages where visitors want facts fast. [SEARCH] https://framerwebsites.com/blog/scrollytelling-guide . One sequence, not a scroll-jacked page.
5. Sky and clouds are already used by Arini. Navy, purple and dark are taken by Goodcall, Rosie and Frontdesk. Yoco owns bright blue with SA small businesses. v1's `#1570EF` blue on a sky is the least ownable choice available.
6. The brief's reference list leans on township vernacular (spaza, taxi rank, barbershop signage). The buyers named on v1 are dentists, physios, vets, law firms and guesthouses. Borrowed kasi styling would be its own cliche and reads as appropriation unless made by people from that tradition, as Nando's did with Marks Salimu.

### What this means for v2
**Three ways to show the call**
- A. "One call, start to finish" stage (the hero). A phone rings at 19:02 at a closed practice; transcript lines appear; a diary strip fills "Thu 10:00"; a WhatsApp message lands on the owner's phone. Build: HTML, CSS keyframes, about 60 lines of script stepping a `data-step` attribute. Tap "Hear this call" and the real recording (v1 already ships `sample-call-dentist.mp3`) drives the steps from `timeupdate`. Degrades: no JavaScript shows all four panels stacked; reduced motion shows the finished state with Next and Back buttons; always a Pause button.
- B. Sticky "follow the call" scroll section replacing "Three steps". A phone stays pinned while four chapters scroll past. Build: `position: sticky` plus `view()` timelines inside `@supports`, with an IntersectionObserver class toggle as fallback. On phones it becomes a plain vertical stack.
- C. "A Thursday at the practice" clock. A native range slider scrubs 07:00 to 22:00; missed-call dots turn into bookings and a rand counter climbs. Reduced motion: two static columns, "Without" and "With". Must be labelled as an illustration, not data.
- Recommendation: A as the hero, B lower down, C only if thread evidence on missed-call numbers is solid.

**Direction**
- Palette idea: warm paper cream background, near-black ink, one hot sign-writer colour (a rooibos red-orange) and a deep teal. Reserve WhatsApp green for the WhatsApp moment only. Check contrast before committing.
- Type idea: a grotesque with real character and width for headings, in the spirit of Yoco's Sharp Grotesk (Bricolage Grotesque is a free candidate [UNVERIFIED]), a plain legible body face, and three to five words of genuinely hand-lettered accent.
- Imagery: the Cape Town partner photographs three real client businesses on a phone, with signed consent. Use them as cut-outs on flat colour with hand-drawn line accents. Commission an SA illustrator for a small spot set once there is revenue. No AI-generated pictures.
- Local feel through specifics: 24-hour times everywhere, "R1 999" with a space as Yoco writes numbers, real suburbs, real names, WhatsApp, load shedding ("Power's off. Phones still answered."), a light "now now" or "sharp" in microcopy.
- Motion system: only `transform` and `opacity`; two durations (200 ms and 400 ms); one hero sequence; `view()` reveals gated by `@supports` and reduced motion; no Lenis, GSAP, Lottie, Rive, WebGL or autoplay video. No build step. Motion budget under 10 KB.
- Drop: the sky photo, the pill badge, icon-in-circle feature cards.

**Steal this**
- https://www.goodcall.com : the staged hero, the Pause button, the no-JavaScript fallback.
- https://www.bland.ai : from, via, to call routing drawn in CSS.
- https://www.getaira.io : the five-step missed-call sequence with status labels.
- https://www.myaifrontdesk.com : video with poster and `preload="none"`.
- https://www.yoco.com/za/ : one strong colour held by earthy neutrals, local product names, real merchants.
- https://dev.to/raxxostudios/css-scroll-driven-animations-6-patterns-i-ship-in-2026-4bm6 : the `@supports` plus reduced-motion wrapper.

### Could not verify / gaps
- Stripe, Linear, Apple, Duolingo, Wise, Monzo, Notion, Loom, Intercom Fin, Superhuman, Arc, Cal.com, Airbnb and the award galleries (Awwwards, Godly, Land-book, Mobbin, Lapa Ninja) were not reachable and search returned nothing specific. No claims made about them.
- Capitec, Discovery, TymeBank, Takealot, SweepSouth, Bolt, Vodacom, MTN, Castle Lite, Studio Muti, Lulama Wolf's style and Design Indaba: nothing usable on visual language was found.
- Firefox 159 and Baseline status for scroll-driven animations rest on a search summary; web.dev could not be opened.
- Library sizes for GSAP and Lenis, Lenis's licence, and the WCAG rule that motion longer than five seconds needs a pause control are from memory.
- No rand price for commissioned illustration. Ask two or three illustrators for quotes.
- No test on a real low-end phone. Test the hero on a Galaxy A06 class device before launch.
- Whether Front Desk AI's buyers browse on entry-level phones at all is unknown; business owners may skew to mid-range devices.


## Thread 7: Teaching: making an owner get it in 10 seconds


Researched 13 Nov 2026. Tags: [READ] fetched and seen by me, [SEARCH] web search summary only, [UNVERIFIED] not confirmed or vendor claim only.
Access limits that shaped this report: Reddit is blocked to the search tool, MyBroadband forum and Mutiny returned 403 or did not resolve, so there are no first-hand Reddit quotes and the Mutiny playbook was not read directly.

### Findings

#### 1. How the best pages teach (mechanisms, read first-hand)

- **Goodcall, animated "story of a call" in the hero.** The owner types one plain sentence ("I run a plumbing company. When someone calls about a job, get their name, what's going on, and the address"), the agent is built, then a sample call scrolls as a transcript and ends in three visible outcomes: "Booked, in your calendar", "Customer's phone: Appointment confirmed", "Your team's phone: Booking received". Every panel is labelled "Example" and there is a "Pause animation" control. Works because it shows cause and effect with no jargon and needs no click or microphone. [READ] https://www.goodcall.com/
- **Smith.ai, recorded call with synced transcript.** A 2:29 audio player in the hero, industry tabs (Law Firms, Home Services, IT), transcript lines appear as the audio plays, then an honest label: "This is a recording. Want to hear how our AI handles your real call? Try the live demo". The AI's first line is "I'm their AI receptionist." Phone number sits in the header. [READ] https://smith.ai/
- **Dialzara, "call the number" card.** Hero card "Try the Live Demo. Hear it live right now. 866-545-ZARA ... This is our actual AI receptionist. Ask anything", with "Tap to call". Works because the phone is the product and nothing has to load. Weakness: it is Dialzara's own receptionist, so the owner does not hear their own business. [READ] https://dialzara.com/
- **CallSphere /preview, generated sample call.** Form: business name, one of 9 business-type tiles, email. "In about 60 seconds we'll generate a custom sample call, with your business name spoken out loud", played on the page with the script shown. Works: hearing your own name. Weakness: email gate before any audio, 60-second wait, and it is a greeting, not a conversation. [READ] https://callsphere.ai/preview
- **CallSphere /demo, pick-an-industry live talk.** 14 industry tiles, each "Tap to Talk", "No signup, no credit card", 5-minute cap. [READ] https://callsphere.ai/demo
- **CallSphere /audit, the strongest "your own problem" device found.** "We'll place test calls to your business number at different hours, measure pickup rate and voicemail drops, then email you a personalized report." Up to 5 silent test calls over 24 hours. The owner sees their own number, not an industry statistic. [READ] https://callsphere.ai/audit
- **Aira /receptionist/demo, pick a real business.** Choose a business, review the public facts it found, then hold a browser voice call with an agent grounded in those facts. Unusually honest copy: "A short demo cannot prove every accent, edge case, phone carrier". Weakness: several steps and a microphone prompt before any payoff. [READ] https://www.getaira.io/receptionist/demo
- **Aira home, five-step missed-call strip.** "1 Customer calls your business ... 3 Voicemail creates a delay ... 4 They call your competitor ... 5 Aira answers instead", under the line "Every missed call is a customer who called your competitor." [READ] https://www.getaira.io/
- **Rosie, "three bad options" framing with no statistics.** "Answer every call yourself / Send calls you can't answer to voicemail / Pay too much for an outsourced service", each with three plain pains ("Most people don't leave a message", "Hard to find time to call back"). Phone number 412-569-0026 in the header. [READ] https://heyrosie.com/
- **Arini, slider calculator plus one-line case study.** Sliders for calls per month, missed-call rate (default 33%), booking rate, patient value. Nav teaser: "How Wolfe Dental turned 500 missed calls per month into $140k of added production". [READ] https://www.arini.ai/roi-calculator
- **My AI Front Desk.** The product page I fetched shows a Voicemail vs Answering service vs Frontdesk table and 12 number-plus-quote customer cards; the named sample calls are not in the static HTML (probably loaded by script). [READ] https://www.myaifrontdesk.com/product/phone-receptionist [UNVERIFIED for the sample-call player]
- **v1 already has more demo than most competitors**: browser talk demo (3:00 cap, live transcript), call-me form, demo line, three sample recordings, four "It is 7pm. Mrs Naidoo calls" stories. But the static HTML still carries "hello@example.com Placeholder" and "+27 00 000 0000 Placeholder" in the contact block. [READ] https://hamzaali.ca/frontdesk-ai/

#### 2. Evidence on what converts (thin, mostly vendor)

- **Navattic/Mutiny test.** It was Trainual's homepage: an interactive product tour versus the existing product video, measured on free-trial signups over "a few weeks". Navattic reports +450%, Mutiny's own post says 437%, plus trial users "116% more engaged" after 14 days. No sample size, traffic or significance published; both publishers sell the tooling; the product is self-serve B2B SaaS. It does not show that a live voice demo beats a video for a salon owner. [SEARCH] https://www.navattic.com/customer/highlights/trainual , https://mutinyhq.com/playbooks/navattic-interactive-demo (not readable from here)
- **Navattic 2026 report**: 40,000+ demos; claims interactive demos convert 12% better than product videos. Vendor data. [SEARCH] https://www.navattic.com/report/state-of-the-interactive-product-demo-2026
- **Phone number placement**: MarketingSherpa case (TravelPass): adding the number under the H1 as well as the header did not hurt online conversion and slightly raised call conversions. No numbers in the summary. [SEARCH] https://marketingsherpa.com/article/case-study/case%20study-how-travel-website-doubled-conversion-rates
- **Form friction**: one law-firm test, phone field optional: completion 6.2% to 8.9%; another test, adding a phone field cut conversions 48%. Agency case studies. [SEARCH] https://vitaldesign.com/phone-number-form-field-case-study/
- **ROI calculators, risk reversal, testimonial formats**: I found no controlled, published test with a sample size. Only vendor claims (for example "testimonials next to the CTA lift 9 to 23% across 31 tests", method undisclosed). [SEARCH] https://proofshow.com/blog/testimonial-placement-on-landing-pages [UNVERIFIED]

#### 3. Missed-call statistics traced to source

| Claim | Where it really comes from | Verdict |
|---|---|---|
| "62% of calls to small businesses go unanswered" | 411 Locals (a US marketing agency), posted Jan 2016: 85 businesses, 58 industries, 30 days. 37.8% answered, 37.8% voicemail, 24.3% nothing. Voicemail counts as "unanswered". Aira's blog mis-dates it as "A 2024 study". [SEARCH] https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/ ; [READ] https://www.getaira.io/blog/missed-business-calls-statistics | Real but weak: 10 years old, US, tiny, vendor. Avoid. |
| "85% of callers who don't get through won't call back" | No primary study. Credited in turn to PATLive, BT Business, AT&T, Numa, Forbes. Fact-checkers trace it to an uncited vendor blog. [SEARCH] https://www.majleads.com/blog/ai-receptionist-statistics-fact-check , https://mylocalvoice.io/missed-call-statistics/ | Untraceable. Do not use. |
| "80% of callers don't leave voicemail" | A 2014 Forbes contributor line, "recent statistics show", no citation. [SEARCH] https://www.futurocorp.com/blogs/customers-wont-leave-voicemail-statistics | Untraceable. Do not use. |
| "62% call a competitor" | Aira cites "Research from Dialzara", another vendor. [READ] Aira blog above | Circular. Do not use. |
| "78% buy from the first business that responds" | "Lead Connect" survey nobody can produce. The MIT/Oldroyd 2007 study measured contact rates for web leads, not purchases. [SEARCH] https://martellosystems.com/blog/speed-to-lead-statistics | Do not use. |
| "$126,000 a year lost" | CallRail product marketing, no inputs disclosed. [SEARCH] mylocalvoice link above | Do not use. |
| "30% of incoming sales calls go unanswered in SA" | BaseCloud (SA CRM vendor) own client data, 2024, no sample size or method. BizAI repeats it on its home page. [READ] https://www.bizai.co.za/ ; [SEARCH] https://www.thesmallbusinesssite.co.za/addressing-the-30-unanswered-incoming-sales-calls-issue-in-south-africa/ | The only SA figure. Vendor data. Not safe as a headline. |
| CallRail consumer survey, Sept 2025, 1,000 US consumers: 78% have given up on a business after one unanswered call, 42% leave a voicemail, 21% call another business immediately | Vendor survey, stated behaviour, primary report not read. [SEARCH] https://oncrew.ai/resources/missed-call-statistics | Usable only with full attribution, and it is US. |
| Vendasta mystery-call test, Nov 2026: 60 page-one Google Maps businesses; 60% answered Tuesday peak, 45% at lunch, 23% Saturday morning; six called back within 72 hours | Vendor, small, but the method is transparent and repeatable. [SEARCH] https://www.vendasta.com/blog/ai-receptionist-vs-human-receptionist/ | Best model to copy locally. |

**South African data that is solid**: Truecaller reports 30 billion+ spam calls to South Africans in 2025 and MTN confirms "a reluctance to answer calls from unknown numbers". [READ] https://techcentral.co.za/ring-reject-repeat-south-africas-spam-call-crisis/279752/ . 17.47 billion in H1 2026, spam answer rate down from 10.2% to 7.8%. [SEARCH] https://iol.co.za/business/2026-08-15-south-africa-records-1747-billion-spam-calls-in-first-half-of-2026/ . No independent SA study of small-business missed calls exists that I could find.

#### 4. Real words (verbatim; SA marked)

Owners:
1. "The ones who just hang up and call the next guy are the ones that sting the most because you don't even know what you lost." Plumber, 47 missed calls in a month, 5 voicemails. [SEARCH] https://www.plumbingzone.com/threads/anyone-else-losing-jobs-to-missed-calls.91027/
2. "47 missed calls and only 5 voicemails is brutal." Same thread. [SEARCH]
3. "can't afford to pay a receptionist at the mo" Salon owner missing up to 20 calls a day during treatments. [SEARCH] https://www.salongeek.com/threads/phone-answering-service.143189/
4. "I couldn't afford one who wasn't paying her way in sales" [SEARCH] https://www.salongeek.com/threads/salon-without-receptionist.263323/
5. Misses about 10 calls a day alone in the salon, but "make sure I call them all back". [SEARCH] https://www.salongeek.com/threads/do-you-return-missed-calls.135357/
6. "When my electrician is out on a job and can't pick up, Rosie handles the call so we never lose a lead." Francisco Fierro, Iron Volt Electric (vendor-published). [READ] https://heyrosie.com/
7. "We were missing calls after 5 PM every day." Artisan Homes (vendor-published). [READ] https://www.myaifrontdesk.com/product/phone-receptionist
8. "We literally never answered the phone." Freak Brothers Pizza. [READ] same page
9. "The phones used to ring all day long. Now we can go an hour without hearing a landline ring." Todd Dusenberry. [READ] same page
10. "helps keep my day organized instead of constantly interrupting it" Victor David, Trustpilot, Dec 2025. [READ] https://dialzara.com/
11. "As soon as the robot answered, people hung up." Estate agent, in a sponsored piece for a human answering service. [SEARCH] https://www.franchising.com/sponsored/20261110_the_secret_cost_of_ai_receptionists_in_franchise_systems.html
12. **SA** "Phone calls are often the first step in understanding the scope of a job ... when calls go unanswered, it stalls the process entirely." Mithundra Sivenandan, Snupit. [READ] https://www.itweb.co.za/article/call-screen-culture-hurts-small-businesses-snupit-warns/GxwQDM1DWpJ7lPVo
13. **SA** "our AI receptionist handles calls professionally 24/7 ... we haven't missed a single lead since going live." Chatterbolic Solutions (vendor-published). [READ] https://www.voicereceptionist.co.za/

Callers and customers:
14. **SA** "Your phone rings. It's an unknown number. You stare at the screen, let it ring out and wait to see if a WhatsApp message follows." Nkosinathi Ndlovu, TechCentral, 2 Apr 2026. [READ] TechCentral link above
15. **SA** "by default, people don't answer their phones. So, if a call comes in, unless it's your spouse, child, friend or mother, people are not eager to answer their phone." Mmathebe Zvobwo, Truecaller SA. [READ] same
16. **SA** "They'd all gone home at 4:30pm but would call me back the next day. They never called back." HelloPeter, Drain Surgeon. [SEARCH] https://www.hellopeter.com/drain-surgeon/reviews/incompetent-plumbing-unprofessional-customer-service-2146879
17. **SA** "my messages were either ignored, I was told they would 'look into it,' or I was left on read." HelloPeter, The Plumbers. [SEARCH] https://www.hellopeter.com/the-plumbers
18. **SA** "nobody is available to assist" HelloPeter, My Tech Zone. [SEARCH] https://www.hellopeter.com/my-tech-zone
19. **SA** "Pick the calls you keep missing, not the calls you handle best." WhichVoIP editorial. [READ] https://whichvoip.co.za/phone-systems/ai-agent-to-answer-business-calls/
20. UK tradesman, paraphrased by search, not verbatim: lets calls ring out mid-job and suspects the caller rings the next business on Google. Thread title: "Anyone else miss calls on the tools". [SEARCH] https://community.screwfix.com/threads/anyone-else-miss-calls-on-the-tools.292023/

#### 5. Objections and how good pages answer them

- **"My customers will hate a robot."** Goodcall answers straight: "Callers are told they're speaking with an AI assistant, and they get an answer right away, 24/7, instead of voicemail." [READ] Dialzara takes the opposite line: "Customers often can't tell they're speaking with an AI." [READ] The best counter is CallRail's framing: some callers will hang up on an AI, and most of them were already hanging up on your voicemail. [SEARCH] https://www.callrail.com/blog/ai-receptionist-vs-human-receptionist
- **Evidence on caller reaction.** AnswerConnect/OnePoll, 6,000 consumers in US, UK and Canada: 29% then 31% say they would hang up on AI. The sponsor sells human answering and it is stated intent. [SEARCH] https://www.prnewswire.com/news-releases/bot-fatigue-harms-businesses-one-in-three-consumers-will-hang-up-on-ai-302679160.html . Upfirst, 450,702 real inbound calls across 503 AI receptionists: saying it is an AI is associated with about 20% fewer hang-ups, mentioning recording about 30% fewer, and opening with the owner being unavailable about 50% more. Correlation, vendor data. [SEARCH] https://upfirst.ai/blog/ai-receptionist-hang-ups . The often-quoted "disclosure cuts sales 79.7%" is Luo et al., Marketing Science 2019: outbound sales calls to about 6,000 finance customers, not inbound reception. [SEARCH] https://econpapers.repec.org/RePEc:inm:ormksc:v:38:y:2019:i:6:p:937-947
- **"What if it gets it wrong?"** Goodcall: "It hands off ... And it tells you what it heard". Rosie: every call "summarized, transcribed, and recorded". v1 already says "It says so. It takes the caller's name, number...". A real failure mode worth pre-empting is silence after "one moment please". [READ, single unverified author] https://dev.to/chenwengui23/your-ai-said-one-moment-please-and-the-customer-heard-nothing-for-9-minutes-4k78
- **"I am not technical."** Rosie: "no tech skills, no developer needed". v1: "Three steps. We do the setup." Done-for-you is the stronger answer for SA.
- **"Is it safe / legal?"** WhichVoIP's SA guide: the business is the responsible party, the vendor is the operator, ask for a data processing agreement and a retention period, and "The caller must be told the call may be answered and processed by an AI system." US-hosted models need a documented cross-border safeguard. [READ] WhichVoIP link above
- **Disclosure law.** SA has no statute that explicitly makes a bot identify itself; the draft National AI Policy was withdrawn in late April 2026 after fake citations. [READ] https://techcentral.co.za/the-ai-policy-that-ai-broke/280739/ . The working hooks are POPIA notification duties and the Consumer Protection Act ban on misleading representations; RICA lets a party to a call record it. [SEARCH] https://www.recordinglaw.com/south-africa/recording-laws/ . EU AI Act Article 50 has required AI disclosure at first interaction since 2 Aug 2026. [SEARCH] https://nordflux.de/en/insights/eu-ai-act-article-50-labelling-obligation-for-chatbots-and-voice-agents-from-2-august-2026 . Not legal advice; needs an SA attorney.

#### 6. Ten real headlines, rated for a salon owner who has never heard of AI (5 = instantly clear)

| Headline | Source [READ] | Score |
|---|---|---|
| "Every missed call is a customer who called your competitor." (section head) | getaira.io | 5 |
| "The AI Receptionist Who Never Misses A Call" | dialzara.com | 4 |
| "The AI receptionist that answers your phone and books your appointments." | v1, hamzaali.ca | 4 |
| "The easiest AI answering service for small business" | heyrosie.com | 3 |
| "Your AI voice agent answers every call." | goodcall.com | 3 |
| "Focus on your patients. Let AI do the rest." | arini.ai | 3 |
| "Answer every call. Qualify every lead. Close better clients." | smith.ai | 3 |
| "The AI front desk built for South Africa" | lekkerai.co.za | 3 |
| "AI receptionist that calls, texts, emails, and chats" | myaifrontdesk.com | 2 |
| "Automating the Frontline" (the subhead "Never miss another customer call" scores 5) | voicereceptionist.co.za | 1 |
| "Your AI workforce for the front office. Fully staffed, 24/7." | getaira.io | 1 |
| "One Platform. Your Entire Business." | bizai.co.za | 1 |

Pattern: the clear ones name the phone and the outcome. The weak ones name the technology or the category.

### Surprises and things that contradict the v1 page or the brief

1. **The famous statistics are almost all fake or stale.** 85%, 80%, 78% and $126K have no source; 62% is a 2016 count of 85 US businesses. Competitors (Aira, Dialzara, BizAI) use them anyway. Honesty is an open lane.
2. **The SA problem is worse than "missed call", and nobody is saying it.** South Africans screen unknown numbers, so the owner's 6pm call-back from a cell phone also fails. The missed call is lost twice. This is sourced to TechCentral, MTN and Snupit, all read first-hand.
3. **Disclosure seems to help, not hurt.** The only large observed dataset (Upfirst) links "I'm an AI" to fewer hang-ups. Dialzara's "can't tell" pitch is the riskier one, and EU law now forbids it.
4. **v1's headline is already clearer than most competitors'.** The gap is not wording. It is that the page asserts ("No missed calls. No lost customers.") instead of making the owner feel their own loss, and nothing moves.
5. **v1's static HTML still shows placeholder email and phone numbers.** For a product that sells answering the phone, a dead number is the worst possible signal.
6. **"Frontdesk AI" is already taken twice**: My AI Front Desk now brands itself "Frontdesk", and ICTGlobe promotes a "Frontdesk AI" receptionist to SA resellers on MyBroadband. [SEARCH] https://mybroadband.co.za/news/industrynews/672193-frontdesk-ai-the-reseller-opportunity-sitting-on-your-clients-phone-line.html
7. **The independent SA buyer's guide says full receptionist replacement is "a rare match for SA SMEs in 2026"** and that after-hours and overflow is the low-risk entry. v1's "Every call answered" leans the other way. [READ] WhichVoIP

### What this means for v2

**First-screen message, three candidates** (each names the phone, the moment, the outcome):
1. "Your phone rang while you were busy. We answered it and booked the client."
2. "When you can't pick up, we do. Every call answered, every booking sent to your WhatsApp."
3. "Stop losing clients to a ringing phone." Subhead: "An AI receptionist that answers, books and messages you the details. You keep your number."
Keep the phone number or a "Call the demo line" button in the header (Rosie, Smith.ai, Dialzara all do; the one placement test found no harm).

**Show-the-problem device.** A two-lane animated timeline of one evening call, in the style of Goodcall's hero and Aira's five steps, set in a named SA business. Lane A, without: 18:42 phone rings, owner is busy with a client, caller hangs up, taps the next result on Google, 19:30 owner calls back from a cell number, the caller lets it ring out. Lane B, with: answered on the second ring, booked for Thursday 10:00, WhatsApp to the owner. Lane A's last beat is the SA-specific truth from finding 2. Under it, a three-input calculator (missed calls per week, average booking value in rand, how many would have booked) where every assumption is the owner's own, with no borrowed percentages. Later, add a CallSphere-style "we test-call your number" audit.

**Demo ladder.**
- 10 seconds, no click, no mic: the animated call story plays in the hero with a pause button, plus a one-tap "Hear a real call" audio with synced transcript, labelled as a recording (Smith.ai pattern).
- 1 minute: pick your business type (salon, dentist, workshop, guesthouse), type your business name, and either "Call me now" or dial the demo line; the receptionist answers with that name. Phone first, browser microphone second, because the phone needs no permission prompt.
- 5 minutes: the owner's own number tested (missed-call audit), or a 15-minute WhatsApp setup call, then a free trial on after-hours calls only.

**Disclosure.** Have the receptionist say it is an AI assistant for the business and that the call is recorded, in the first sentence, and sell that as a feature. Evidence: Upfirst, Goodcall, Smith.ai, EU Article 50, WhichVoIP's POPIA reading.

**Statistics.**
- Safe: your own numbers; Truecaller/TechCentral spam-call and call-screening facts with attribution; a first-party mystery-call test (call 50 Cape Town salons, dentists and workshops at lunch, 17:30 and Saturday morning, publish the method), which would be the first honest SA missed-call figure.
- Use only with full attribution and "US survey": CallRail 2025 (78% gave up after one unanswered call; 42% leave voicemail).
- Avoid: 85% never call back, 80% no voicemail, 62% unanswered, 62% call a competitor, 78% first responder, $126K a year, BaseCloud 30% as a national figure, WhichVoIP's unsourced "two-thirds hang up on voicemail".

### Could not verify / gaps

- Mutiny playbook, 411 Locals post, Upfirst study, CallRail and Invoca primary reports: all [SEARCH] only; hosts are blocked here.
- No Reddit quotes (crawler blocked) and no first-hand HelloPeter page reads; HelloPeter quotes come from search summaries and should be re-checked before any public use. No genuine SA owner interview about missed calls was found; SA owner voice is the biggest hole and is best filled by the Cape Town partner interviewing 5 to 10 owners.
- No controlled test anywhere compares a live voice demo, a recorded call and a video for small-business buyers. The demo ladder is reasoned from patterns, not proven. Test it.
- SA legal position on AI disclosure and on sending call audio to a US-hosted model needs a POPIA attorney.
- My AI Front Desk named sample calls were not visible in static HTML.
