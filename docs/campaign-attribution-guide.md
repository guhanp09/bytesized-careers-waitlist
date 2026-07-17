# Campaign attribution guide

ByteSized Careers uses first-party campaign attribution for the standalone early-access
registration. It does not use advertising pixels, third-party analytics, advertising cookies,
session replay, fingerprinting, or advertising click IDs.

## Supported link parameters

Only these query parameters are accepted:

| Parameter | Maximum | Use |
| --- | ---: | --- |
| `utm_source` | 100 | Platform, community, partner, or outreach origin |
| `utm_medium` | 100 | Channel such as `paid-social`, `community`, or `outbound` |
| `utm_campaign` | 150 | Stable campaign name |
| `utm_content` | 150 | Creative or message variant |
| `utm_term` | 150 | Keyword or audience/work category |
| `utm_geo` | 50 | Intended campaign geography |
| `utm_placement` | 100 | Placement such as `ig-reels`, `search`, or `dm` |
| `ref` | 100 | Existing partner/referral label |

Do not place email addresses, names, tokens, or other personal information in campaign
parameters. Unknown parameters—including `fbclid`, `gclid`, `msclkid`, resume credentials,
and arbitrary redirects—are neither forwarded nor stored.

Values are URL-decoded, trimmed, length-bounded, and rejected if they contain control
characters, line breaks, replacement characters, or markup delimiters. Source, medium, and
geography are lower-cased. Repeated instances of one parameter are treated as ambiguous and
ignored. Campaign, content, term, placement, and referral retain useful readable casing.

## First touch and last touch

First touch is the original accepted campaign, referral, external referrer hostname, or direct
visit. Once a lead exists it is immutable. Reloads, verification, direct returns, internal
navigation, and later campaigns cannot replace it.

Last touch initially matches first touch. It changes only after a new valid campaign/referral
visit or meaningful external referrer. Direct visits, refreshes, verification, and resume visits
without attribution never overwrite it. A later explicit campaign can update last touch while
first touch remains fixed.

An external referrer is stored only as a hostname. Paths, queries, and fragments are discarded.
ByteSized Careers referrals are not treated as external. When neither campaign nor external
referrer exists, the touch is classified as direct. Historical leads without trustworthy
structured attribution remain `Legacy / Unknown`; they are never retroactively guessed.

## Persistence flow

The root CTA forwards only the supported allowlist to `/early-access`. A versioned first-party
`bytesized_waitlist_attribution` localStorage record retains the two touches before an email or
lead ID exists. It contains no personal information or visitor identifier.

At the first successful email save, `first_touch_attribution` and `last_touch_attribution` JSONB
become authoritative. A token-authorized resume can synchronize a newly observed explicit last
touch, but no server action used by verification or progressive form saves writes first touch.
The records therefore survive verification, resume, phone capture, and completion. Legacy
`source`/UTM/referrer columns remain compatibility-only and are not removed.

## Admin and export

The protected lead detail presents separate First touch and Last touch blocks. The overview has
separate source-performance tables with saved-email, verified, completed, verification-rate,
completion-rate, talent, hirer, and both-role counts. Lead filters can select first or last touch,
then source, medium, campaign, role, and completion state.

The protected CSV preserves every existing column and adds clearly named `first_touch_*` and
`last_touch_*` columns. Spreadsheet formula starters are neutralized before CSV quoting. No
verification secret, resume token, code, or provider response is exported.

Current reporting begins at saved email because the application has no trustworthy page-view or
form-start event table. Ad-platform impressions, clicks, and spend require platform reporting or
a future deliberately scoped first-party event system; they are not fabricated here.

## Copyable campaign links

### Meta talent

<https://bytesizedcareers.com/early-access?utm_source=meta&utm_medium=paid-social&utm_campaign=ea_talent_india&utm_content=video-editor-static-a&utm_term=video-editing&utm_geo=in&utm_placement=ig-reels>

### Meta hirer

<https://bytesizedcareers.com/early-access?utm_source=meta&utm_medium=paid-social&utm_campaign=ea_hirer_india&utm_content=hirer-pain-static-a&utm_term=creator-hiring&utm_geo=in&utm_placement=ig-feed>

### Google Search

`https://bytesizedcareers.com/early-access?utm_source=google&utm_medium=paid-search&utm_campaign=ea_hirer_search_india&utm_content=search-rsa-a&utm_term={keyword}&utm_geo=in&utm_placement=search`

Replace `{keyword}` with a URL-encoded keyword when generating the final link.

### LinkedIn outbound

<https://bytesizedcareers.com/early-access?utm_source=linkedin&utm_medium=outbound&utm_campaign=ea_hirer_manual&utm_content=agency-dm-a&utm_geo=in&utm_placement=dm>

### Email outbound

<https://bytesizedcareers.com/early-access?utm_source=email&utm_medium=outbound&utm_campaign=ea_hirer_manual&utm_content=youtube-channel-email-a&utm_geo=in>

### Reddit community

<https://bytesizedcareers.com/early-access?utm_source=reddit&utm_medium=community&utm_campaign=ea_editor_feedback&utm_content=community-post-a&utm_term=video-editing&utm_geo=in&utm_placement=post>

### Discord community

<https://bytesizedcareers.com/early-access?utm_source=discord&utm_medium=community&utm_campaign=ea_editor_resource&utm_content=server-post-a&utm_geo=in&utm_placement=resource-channel>
