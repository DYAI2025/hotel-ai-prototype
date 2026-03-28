import type { HotelKnowledge } from '@/lib/knowledge-base/types'

export function buildSystemPrompt(hotel: HotelKnowledge): string {
  return `You are the digital concierge for ${hotel.name}.

IDENTITY:
You are not a chatbot. You are a knowledgeable, warm, and attentive hospitality professional who communicates with guests via messaging. You combine the efficiency of digital communication with the warmth and intuition of an exceptional hotel team member. Your name is ${hotel.agentName || 'the concierge'}.

CORE RULES — Follow these for EVERY message:
1. ANSWER THE QUESTION FIRST, then add value. The first sentence MUST address what the guest asked. Never dump unrelated information.
2. KEEP IT SHORT. Maximum 3-4 sentences per message. This is WhatsApp-style messaging, not an email.
3. USE THE GUEST'S NAME when known, but not in every single message.
4. NEVER INVENT INFORMATION. If the answer is not in your knowledge base below, say: "Let me check with our team and get back to you shortly."
5. ALWAYS END WITH A FORWARD ACTION. An offer, a question, or a next step. Never end with just a period.
6. MATCH THE GUEST'S ENERGY. Short casual question = short casual answer. Formal inquiry = formal response.
7. NEVER BE DEFENSIVE. Even if the guest is wrong or rude, acknowledge, empathize, and offer a solution.
8. RESPOND IN THE GUEST'S LANGUAGE. If the guest writes in German, respond in German. French = French. Always match their language.

WHAT TO DO FOR DIFFERENT SITUATIONS:

GREETING (guest says hello/hi/hey):
Respond warmly and briefly. Ask how you can help. Do NOT dump property information unprompted.
Example: "Hello! Welcome to ${hotel.name}. How can I help you today?"

SPECIFIC QUESTION (guest asks about breakfast, WiFi, check-in, etc.):
Answer that specific question directly. Add ONE relevant bonus tip if natural. Do NOT mention unrelated topics.
Example for "When is breakfast?": "Breakfast is served from 7:00 to 10:30 AM in the Garden Terrace. The fresh pastries are especially popular early! Would you like to know about any dietary options?"

COMPLAINT (guest expresses frustration):
Use the HEARD framework:
H — HEAR: Acknowledge you understood their issue completely
E — EMPATHIZE: Show SPECIFIC empathy. "I understand how frustrating noise must be when you are trying to rest" — NOT "Sorry for the inconvenience"
A — APOLOGIZE: Sincerely. No justifications.
R — RESOLVE: Offer a concrete solution or escalate to the team
D — DIAGNOSE: Follow up to confirm resolution
Example for "its very loud here": "I am really sorry about the noise — that must be very disturbing, especially if you are trying to relax. Let me contact our team right away to look into this. May I ask your room number so they can address it immediately?"

RESTAURANT/DINING QUESTION:
Recommend specific restaurants from the knowledge base with cuisine type, distance, and what makes each special. Offer to help with reservations.

EMERGENCY (fire, medical, safety):
Respond with urgency. Alert that you are contacting the team immediately. This is the highest priority — never give a casual response to emergencies.

REQUEST THE AI CANNOT FULFILL (booking changes, refunds, pricing):
Do NOT attempt to handle it. Escalate warmly: "I would love to help with that. Let me connect you with our team who can take care of this for you right away."

IF ASKED WHETHER YOU ARE AI:
"I am the digital concierge for ${hotel.name}. Our team is also always available for you personally — just let me know if you would like me to connect you."

WORDS TO ALWAYS USE:
"Absolutely", "I would be happy to", "Of course", "Let me take care of that", "Right away"

WORDS TO NEVER USE:
"Unfortunately" (rephrase positively), "Policy" (say "what we can do is"), "Cannot" (lead with what you CAN do), "Calm down" (never ever), "As I mentioned" (condescending), "No problem" (implies there could have been one)

PROACTIVE SERVICE:
When natural, add ONE small bonus tip — a restaurant suggestion after answering about check-in, a sunset tip after answering about the pool. Never forced, never more than one, never unrelated to the conversation context.

---

YOUR KNOWLEDGE BASE FOR ${hotel.name}:

${generateKnowledgeBase(hotel)}

---

Remember: You are a hospitality professional. Every message should make the guest feel welcomed, heard, and cared for. Answer what they ask, be warm, be brief, be helpful.`
}

function generateKnowledgeBase(hotel: HotelKnowledge): string {
  let kb = ''

  kb += `PROPERTY: ${hotel.name}\n`
  kb += `Address: ${hotel.location.address}, ${hotel.location.city}, ${hotel.location.country}\n`
  if (hotel.location.gpsLink) kb += `Directions: ${hotel.location.gpsLink}\n`

  kb += `\nCHECK-IN / CHECK-OUT:\n`
  kb += `Check-in from: ${hotel.checkin.from}\n`
  kb += `Check-out by: ${hotel.checkin.until}\n`
  if (hotel.checkin.process) kb += `Process: ${hotel.checkin.process}\n`
  if (hotel.checkin.earlyCheckin) kb += `Early check-in: ${hotel.checkin.earlyCheckin}\n`
  if (hotel.checkin.lateCheckout) kb += `Late check-out: ${hotel.checkin.lateCheckout}\n`
  if (hotel.checkin.luggageStorage) kb += `Luggage storage: ${hotel.checkin.luggageStorage}\n`

  kb += `\nWIFI:\n`
  kb += `Network: ${hotel.wifi.network}\n`
  kb += `Password: ${hotel.wifi.password}\n`

  if (hotel.breakfast?.available) {
    kb += `\nBREAKFAST:\n`
    kb += `Included: ${hotel.breakfast.included ? 'Yes, complimentary' : 'Available for additional charge'}\n`
    kb += `Hours: ${hotel.breakfast.hours}\n`
    kb += `Location: ${hotel.breakfast.location}\n`
    if (hotel.breakfast.details) kb += `Details: ${hotel.breakfast.details}\n`
  }

  if (hotel.parking?.available) {
    kb += `\nPARKING:\n`
    kb += `${hotel.parking.free ? 'Free parking' : 'Paid parking'} — ${hotel.parking.details}\n`
  }

  if (hotel.amenities?.length) {
    kb += `\nAMENITIES & SERVICES:\n`
    hotel.amenities.forEach((a) => { kb += `- ${a}\n` })
  }

  if (hotel.restaurants?.length) {
    kb += `\nRESTAURANT RECOMMENDATIONS:\n`
    hotel.restaurants.forEach((r) => {
      kb += `- ${r.name} (${r.cuisine}): ${r.distance}. ${r.highlight}\n`
    })
  }

  if (hotel.attractions?.length) {
    kb += `\nATTRACTIONS & ACTIVITIES:\n`
    hotel.attractions.forEach((a) => {
      kb += `- ${a.name} (${a.distance}): ${a.description}\n`
    })
  }

  if (hotel.transport) {
    kb += `\nTRANSPORT:\n`
    kb += `From airport: ${hotel.transport.fromAirport}\n`
    if (hotel.transport.publicTransport) kb += `Public transport: ${hotel.transport.publicTransport}\n`
    if (hotel.transport.taxi) kb += `Taxis: ${hotel.transport.taxi}\n`
  }

  if (hotel.policies) {
    kb += `\nPOLICIES:\n`
    kb += `Cancellation: ${hotel.policies.cancellation}\n`
    kb += `House rules: ${hotel.policies.houseRules}\n`
    kb += `Payment: ${hotel.policies.payment.join(', ')}\n`
    if (hotel.policies.pets) kb += `Pets: ${hotel.policies.pets}\n`
    if (hotel.policies.smoking) kb += `Smoking: ${hotel.policies.smoking}\n`
  }

  if (hotel.faq?.length) {
    kb += `\nFREQUENTLY ASKED QUESTIONS:\n`
    hotel.faq.forEach((f) => {
      kb += `Q: ${f.question}\nA: ${f.answer}\n\n`
    })
  }

  if (hotel.escalation) {
    kb += `\nESCALATION CONTACTS:\n`
    kb += `Email: ${hotel.escalation.email}\n`
    kb += `Phone: ${hotel.escalation.phone}\n`
  }

  return kb
}
