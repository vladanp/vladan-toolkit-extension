# Chrome Web Store listing kit

Everything to paste into the [developer dashboard](https://chrome.google.com/webstore/devconsole/6088a562-b69d-4e8a-bde9-8b9eb736f10a/ifcagkojnmahlcekjoemogpnjjpnemel/edit).
Images are in this folder; regenerate them with `pnpm store-assets`. Update this file when features change.

## Store listing tab

**Description** (the summary line comes from the manifest automatically):

```
Vladan Toolkit removes distractions and tracking from the websites you use. Every tweak is optional: switch it on or off from the toolbar popup or the settings page, and changes apply instantly to open tabs. "Pause on this site" in the popup turns every tweak off on the site you are on, until you resume it.

YouTube
• Hide YouTube Shorts: Shorts shelves, Shorts in the home feed, subscriptions, search and the video sidebar, Shorts on channel pages, and the Shorts menu entries. Regular videos are left untouched.
• Hide watched videos in Subscriptions: videos you've started or finished disappear from your Subscriptions feed.
• Skip sponsors: skips sponsor segments, self promotion, subscribe reminders and intros, with an Undo button. Segment data comes from the SponsorBlock community project (sponsor.ajay.app, CC BY-NC-SA 4.0), looked up privately: only a short hash prefix of the video id is sent.
• Show YouTube dislikes: shows the dislike count next to the dislike button, with estimates from the Return YouTube Dislike project (returnyoutubedislike.com), which receives the id of the video you open.
• Default video quality: plays videos in the quality you pick (1080p unless you change it, or the best below it) instead of YouTube's automatic choice.
• Original audio and title: plays videos with their original audio instead of a dubbed track, and shows the original title on the video page instead of a machine translation (looked up from YouTube itself).

Reddit
• Reddit cleaner: hides promoted posts and other ads, awards, and "Trending today" in search, on new and old Reddit.
• Skip machine translated pages: Reddit posts linked from Google with a machine translation ("?tl=…") open in their original language.

LinkedIn
• Hide promoted and suggested posts: hides ads ("Promoted") and "Suggested" posts in your feed.

Popups
• Reject cookie banners: rejects cookie consent popups, or hides them when there is no way to reject. Uses DuckDuckGo's open source autoconsent rules, bundled in the extension.
• Hide newsletter and signup popups: hides "Join our newsletter" and "Get 10% off your first order" overlays with their dimmed backdrop, and lets you scroll again. Forms you open yourself stay.
• Hide chat widgets: hides "Chat with us" bubbles and support chats (Intercom, Drift, Zendesk, HubSpot, Crisp, Tawk.to, LiveChat, Tidio and more).
• Decline "Allow notifications?" prompts: notification requests a site makes on its own are answered "no" before Chrome asks you; sites' own notification popups are hidden. Sites you already allowed, and buttons you click, still work.
• Hide "Sign in with Google" popups: stops Google's One Tap sign in prompt. "Sign in with Google" buttons still work.
• Block "Leave site?" prompts: stops "Leave site? Changes you made may not be saved" prompts on pages you haven't typed on. Pages you typed on still warn you.

All websites
• Remove tracking from links: strips utm_source, fbclid, gclid and other tracking parameters from web addresses before pages load.
• Skip link redirects: links that Google, YouTube, Facebook, Instagram, Reddit, LinkedIn, Steam and others route through a redirect or "You are leaving" page go straight to the real page.
• Open original pages instead of AMP: links to Google's AMP viewer or the AMP cache, and sites' own AMP pages, open the site's normal page.
• Allow copy, paste and right-click: undoes sites' blocks on selecting and copying text, pasting into form fields and the right-click menu. Editors and apps' own menus keep working.
• Dark pattern detector: outlines and fades countdown timers and "only 2 left!" or "12 people are viewing" messages on shopping sites, so they don't rush you.

Privacy: the extension collects no data. It stores only your settings, synced with your Chrome profile. No analytics, no tracking, no remote code. Only the dislike counts need the id of the video you open; switch them off and that lookup stops.

Open source: https://github.com/vladanp/vladan-toolkit
```

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| Category         | Functionality & UI                               |
| Language         | English                                          |
| Store icon       | comes from the package (128px)                   |
| Screenshot       | `screenshot-1-toolkit.png` (1280x800)            |
| Small promo tile | `promo-small-440x280.png`                        |
| Homepage URL     | https://github.com/vladanp/vladan-toolkit        |
| Support URL      | https://github.com/vladanp/vladan-toolkit/issues |

## Privacy tab

**Single purpose description:**

```
Cleans up the websites the user visits: removes distractions (YouTube Shorts, watched videos, sponsor segments, Reddit and LinkedIn ads), popups (cookie consent, newsletter, chat, notification, sign in and "Leave site?" prompts), link tracking parameters, link redirect pages, AMP pages and Reddit machine translations, undoes copy and paste blocking, flags fake urgency messages, and restores YouTube details (dislike counts, a fixed video quality, original audio and titles). Each customization can be switched on or off in the extension's settings.
```

**Permission justifications:**

| Permission                            | Justification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                             | `Saves the user's settings (each feature's on/off switch, the chosen video quality) in chrome.storage.sync. Nothing else is stored.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `scripting`                           | `The cookie banner feature runs a few small functions bundled with the extension (from DuckDuckGo's open source autoconsent library) in the page, to reject a consent popup through the consent manager's own API when it can't be done by clicking. No remote or user provided code is run.`                                                                                                                                                                                                                                                                                                           |
| `declarativeNetRequestWithHostAccess` | `Removes tracking parameters (utm_source, fbclid, ...) from web addresses before pages load, sends links to Google's AMP viewer and the AMP cache (google.com/amp/s/..., cdn.ampproject.org) to the page they show, and removes Reddit's machine translation parameter (tl=...). These use static rules bundled with the extension; a dynamic allow rule exempts sites the user paused.`                                                                                                                                                                                                                |
| Host permission (all websites)        | `Cookie banners, newsletter and chat popups, notification and sign in prompts, fake urgency messages, "Leave site?" prompts, copy and paste blocking, link redirect pages, AMP pages and link tracking parameters appear on any website, so those features need to run on all sites. Their scripts only hide or mark elements in the page, answer prompts, let the user copy and paste, or open a page's normal version or a link's real address; the extension does not collect or transmit page content. YouTube, Reddit and LinkedIn features run only on youtube.com, reddit.com and linkedin.com.` |

**Remote code:** `No, I am not using remote code.`

**Data usage:** tick **Web history** (the dislike counts send the id of the YouTube video being opened to
Return YouTube Dislike) and none of the other data types, then tick all three certifications (not sold to
third parties; not used for unrelated purposes; not used for creditworthiness/lending).
(The SponsorBlock lookup sends only a 4-character hash prefix of a YouTube video id, which can't identify the
video or the user. Both lookups are described in the privacy policy.)

**Privacy policy URL:** `https://github.com/vladanp/vladan-toolkit/blob/main/PRIVACY.md`

## Distribution tab

| Field      | Value                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| Visibility | **Unlisted** (installable via link, not searchable), or Public or Private |
| Regions    | All regions                                                               |
| Payment    | Free                                                                      |

Click **Save draft** on each tab. Don't click "Submit for review": merging the GitHub Release PR uploads the
tested build and submits it automatically (once `CWS_PUBLISH` is on).
