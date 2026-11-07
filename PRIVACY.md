# Privacy policy: Vladan Toolkit

_Last updated: November 7, 2026_

Vladan Toolkit does **not collect or sell any personal or browsing data**, and has no servers of its own.
Everything runs inside your browser, except the two lookups described under "Outside services"; one of them
(dislike counts, which you can switch off) sends the id of the YouTube video you open.

- **What is stored:** only your on/off choice for each feature (the video quality you pick, and the sites you paused), in Chrome's
  extension storage (`chrome.storage.sync`), so it follows your Chrome profile. It never leaves Google's Chrome
  sync.
- **What runs on websites:**
  - **YouTube** (www.youtube.com): stylesheets that hide Shorts and watched videos in Subscriptions; scripts that
    skip sponsor segments in the video you're watching, show its dislike count, set the video quality you
    picked, and pick its original audio track and title (the title comes from YouTube's own oEmbed address on
    youtube.com, like the page's other requests).
  - **Reddit** (www.reddit.com, old.reddit.com): a stylesheet that hides ads, awards and trending searches; the
    machine translation parameter (`tl=`) is removed from Reddit addresses (a rule Chrome applies itself).
  - **LinkedIn** (www.linkedin.com): a script that hides promoted and suggested posts in the feed.
  - **All websites:** cookie consent popups are rejected or hidden (using DuckDuckGo's open source
    autoconsent rules, bundled in the extension); newsletter/signup popups, chat widgets, sites' own
    notification popups and Google's One Tap sign in prompt are hidden;
    notification permission requests you didn't make are answered "no"; "Leave site?" prompts are stopped on
    pages you didn't type on; sites' blocks on copying, pasting and right-clicking are undone; links through
    known redirect pages (Google, Facebook, Reddit, LinkedIn and others) go straight to their real address; countdown timers and "only 2 left"
    messages are outlined; AMP pages are swapped for the site's normal page (its address is in the AMP page
    itself). To do this the extension looks at the page inside your browser. Tracking parameters such as
    `utm_source` and `fbclid` are removed from web addresses, and links to Google's AMP viewer and the AMP cache
    go to the page itself; Chrome applies those rules itself.
    None of this records or sends page content anywhere.
- **Outside services** (no cookies or account details are sent to either):
  - To skip sponsors, the extension asks [SponsorBlock](https://sponsor.ajay.app) (a free, community
    database) which parts of a video to skip. It sends only the **first 4 characters of a hash of the video's
    id**, which matches many unrelated videos, and picks the right video from the answer locally, so SponsorBlock
    can't tell which video you watch. Switch "Skip sponsors in YouTube videos" off to stop these requests.
  - To show dislike counts, the extension asks [Return YouTube Dislike](https://returnyoutubedislike.com) for
    the count of the video you open. This request contains the **video's id**, so that service can see which
    videos are opened (see "What data do you collect" in [their FAQ](https://returnyoutubedislike.com/faq)).
    Switch "Show YouTube dislikes" off to stop these requests.
- **No analytics, tracking, ads, or remote code.**

The source code is public: https://github.com/vladanp/vladan-toolkit

Questions: open an issue at https://github.com/vladanp/vladan-toolkit/issues
