# The Crossing · Indigo Estate

An accountability practice for members of [Indigo Estate](https://indigoestate.co.uk). Members name a pattern, trace it to the belief and the voice beneath it, check in each day, ride out urges, question the belief, and walk forty held days to release it.

- **Front end:** Vite + React (sign-in) + the app itself in `src/crossing.js`
- **Database, logins, emails, AI:** [Convex](https://convex.dev) (`convex/`)
- **Hosting:** Cloudflare Pages
- **Reminder and password-reset emails:** Brevo
- **The Mirror (optional AI reflections):** Anthropic API, capped per member per day

Each member's journal is stored in their own row in Convex. The code only ever returns a member's own journal. Members can download or delete everything from **Witness → Your account**.

---

## Going live, step by step

You need: a Convex account, a Cloudflare account, your Brevo account, and (optionally) an Anthropic API key for the Mirror.

### 1. Create the Convex project (once, on your computer)

```bash
git clone https://github.com/Machala80/indigo-crossing
cd indigo-crossing
npm install
npx convex dev
```

`npx convex dev` asks you to log in and create a project. Call it **indigo-crossing**. It also writes your test address into `.env.local` and regenerates `convex/_generated/` (that's expected). Leave it running, open a second terminal in the same folder, and run:

```bash
npx @convex-dev/auth
```

Answer **yes** to the questions. This creates the sign-in keys. When it asks for the site URL, use `http://localhost:5173` for now.

Then try it locally with `npm run dev` and open http://localhost:5173. Stop both with Ctrl+C when you're happy.

### 2. Set up production in Convex

In the [Convex dashboard](https://dashboard.convex.dev), open **indigo-crossing → Production**.

1. **Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `SITE_URL` | `https://crossing.indigoestate.co.uk` |
   | `APP_URL` | `https://crossing.indigoestate.co.uk` |
   | `BREVO_API_KEY` | your Brevo API key (Brevo → SMTP & API → API keys) |
   | `BREVO_SENDER_EMAIL` | a sender you've verified in Brevo, e.g. `hello@indigoestate.co.uk` |
   | `BREVO_SENDER_NAME` | `Indigo Estate` |
   | `ANTHROPIC_API_KEY` | *(optional)* turns on the Mirror |
   | `MIRROR_DAILY_LIMIT` | *(optional)* reflections per member per day, default `12` |
   | `ADMIN_EMAILS` | your email(s), comma-separated: gives you Plus and the owner dashboard |
   | `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (a restricted key is fine, see below) |
   | `STRIPE_PRICE_MONTHLY` | the `price_…` ID of the £4.99 monthly price |
   | `STRIPE_PRICE_YEARLY` | the `price_…` ID of the £39 yearly price |
   | `STRIPE_WEBHOOK_SECRET` | the `whsec_…` signing secret from the webhook below |

2. Create the production sign-in keys from your computer:
   ```bash
   npx @convex-dev/auth --prod
   ```
3. **Settings → Deploy Keys → Generate Production Deploy Key.** Copy it; you need it in step 3.

### 2b. Crossing Plus payments (Stripe)

1. **Product catalogue → Add product** `Crossing Plus` with two recurring prices: £4.99 monthly and £39 yearly. Copy both `price_…` IDs into Convex.
2. **Developers → API keys → Create restricted key** named `The Crossing`, with **Write** on *Checkout Sessions*, *Customer portal* and *Customers*, and **Read** on *Subscriptions* and *Prices*. Put it in Convex as `STRIPE_SECRET_KEY`.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-deployment>.convex.site/stripe-webhook` (Convex shows the `.convex.site` address under Settings → URL & Deploy Key, "HTTP Actions URL")
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret (`whsec_…`) into Convex as `STRIPE_WEBHOOK_SECRET`.
4. **Settings → Billing → Customer portal**: switch it on and allow cancelling and switching between the two prices. This is the "Manage or cancel my plan" page.
5. **Indigo members get Plus free:** Product catalogue → Coupons → New: 100% off, duration *Forever*, with a promotion code such as `INDIGOMEMBER`. Share the code in the members' area.

**Free vs Plus.** Free: one active pattern, Today, the pull is here, examen, Quest, Witness, reminders, download and delete. Plus: unlimited patterns, Question the belief, the Future (Sovereign Year) and the Mirror. The Mirror is also enforced on the server, as it costs money per use.

**Owner dashboard:** signed in with an `ADMIN_EMAILS` address, go to Witness → Your account → Owner dashboard. It shows counts only, never journals or emails.

**Emails the app sends:** password-reset codes, daily reminders (7:30am or 8pm UK time) and, for members with a Sovereign Year and reminders on, a Sunday 6pm "close your week" email.

### 3. Host it on Cloudflare Pages

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → choose **Machala80/indigo-crossing**.

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name VITE_CONVEX_URL` |
| Build output directory | `dist` |
| Environment variable | `CONVEX_DEPLOY_KEY` = the key from step 2.3 |

Every push to `main` now publishes the database code and the app together.

### 4. Point crossing.indigoestate.co.uk at it

In the Pages project: **Custom domains → Set up a custom domain →** `crossing.indigoestate.co.uk`.

- If indigoestate.co.uk's DNS is managed in Cloudflare, it adds the record for you.
- If the DNS is still at 123-reg, add a **CNAME** record there: host `crossing`, pointing to your project's `*.pages.dev` address (Cloudflare shows it).

### 5. Check it works

1. Open https://crossing.indigoestate.co.uk, create an account, and trace a pattern.
2. Sign out and back in: your pattern should still be there.
3. Try **Forgot password?** and check the code arrives (from Brevo).
4. On Witness, turn on reminders. Morning reminders go at 7:30am and evening ones at 8pm, UK time (clocks changing is handled).
5. On a phone, use **Add to Home Screen** (Safari: Share button; Chrome: menu). It opens like an app.

---

## Working on it

```bash
npm run convex   # run Convex in development (keep open)
npm run dev      # run the app at http://localhost:5173
npm test         # backend tests (privacy, reminders, account deletion, UK clock)
npm run build    # type-check and build
```

- `convex/journal.ts`: load, save, and delete account
- `convex/reminders.ts`: reminder sign-up, daily sending, unsubscribe link
- `convex/mirror.ts`: AI reflections, built on the server so members can't use your key for anything else
- `convex/auth.ts`: email and password sign-in, reset codes by email
- `src/crossing.js`: the app screens and logic
- `src/main.tsx`: sign-in, then hands over to the app

The Crossing is a reflection practice, not therapy. The app signposts Samaritans (116 123) on every page.
