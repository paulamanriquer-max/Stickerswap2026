✅ FIGMA MAKE PROMPT (COPY/PASTE)

Design a production-ready iOS mobile MVP app called Panini Swap.

This is a real startup product concept for trading official FIFA World Cup Panini stickers with nearby collectors.

The core value of the product is:

Help users instantly discover nearby collectors who have stickers they need and who need stickers they have, and enable fast trades.

This is NOT just an album tracker.
The primary experience is trade matching based on real inventory data and location proximity.

PRODUCT PRINCIPLES

Design like a real startup shipping an MVP:

optimize for speed to first value (first match in under 2 minutes)
reduce friction in every flow
prioritize trade matching over inventory management
make interfaces extremely scannable
avoid clutter and unnecessary features
mobile-first, iOS-native feel
strong hierarchy and clean UX
DESIGN SYSTEM

Use a clean, scalable iOS design system inspired by Apple Human Interface Guidelines.

Requirements:

8pt spacing grid
consistent typography scale
rounded cards (12–16px radius)
subtle shadows and separation
neutral base colors with slight football-inspired accents
accessible contrast
reusable components across all screens

Create reusable components for:

sticker card (with status)
sticker status chip (owned / missing / duplicate)
team card
collector card
trade match card
distance badge (e.g. “0.8 mi away”)
match score badge
bottom navigation
search bar
segmented control
primary and secondary buttons
bottom sheet modal
empty states
CRITICAL PRODUCT RULES (DATA MODEL LOGIC)
1. Sticker format must follow official FIFA Panini structure

All stickers must be stored and displayed using this format:

TEAM CODE + NUMBER

Examples:

POR 3 → Portugal — José Sá
CAN 19 → Canada — Cyle Larin

This format must be consistent everywhere:

album tracking
search
duplicates
trade matching
API responses

Never use standalone numbers without team context.

2. Backend data model (conceptual understanding for UI design)

Design UI assuming this structure exists:

Users
id
username
location (lat/lng)
privacy mode
Teams
name
code (POR, CAN, BRA, etc.)
Stickers (global catalog)
id
team_id
code (POR 3)
player_name
User inventory

Each user has stickers with status:

owned
missing
duplicate
Trades
between two users
includes sticker exchanges
status: pending / accepted / completed
3. Matching logic (core product engine)

For any two users:

“You need from them” = their duplicates ∩ your missing stickers
“They need from you” = your duplicates ∩ their missing stickers

Match score = weighted sum of mutual value (prioritize what you gain slightly more than what you give)

The UI should visually highlight:

best matches first
mutual exchange opportunities
trade balance clarity
APP STRUCTURE (BOTTOM NAVIGATION - ONLY 3 TABS)
1. My Album

Personal inventory management.

Features:

album completion progress
team-based sticker organization
sticker status (owned / missing / duplicate)
search by sticker code (e.g. POR 3)
fast update interactions
quick add stickers
2. Matches (PRIMARY EXPERIENCE)

This is the most important screen in the app.

Features:

list of nearby collectors sorted by match score (NOT distance)
show:
username
distance
match score
“they have X you need”
“you have Y they need”
highlight best trade opportunities visually
allow tap into detailed trade view
3. Profile

Low-frequency settings:

username
location permissions
privacy controls (approximate location preferred)
trade preferences
completed trades
availability status
CORE USER FLOWS
1. Onboarding flow
welcome screen with value proposition:
“Find nearby collectors and trade stickers instantly”
select album (FIFA World Cup Panini)
optional quick sticker setup
request location permission
land directly on Matches screen
2. Add stickers flow (FAST INPUT IS CRITICAL)

User should be able to:

select team
enter sticker number OR full code (e.g. POR 3)
assign status:
owned
missing
duplicate
quickly add another without leaving flow

This flow must feel extremely fast and lightweight.

3. Match + trade flow
user opens Matches tab
sees ranked list of nearby collectors
taps a collector
sees trade breakdown:

Section 1: “You need from them”
Section 2: “They need from you”

user can:
send trade request
save collector
SCREENS TO DESIGN (8–10 TOTAL)
1. Welcome / onboarding

Simple, clean value proposition.

2. Album selection

FIFA World Cup Panini album selection.

3. Quick setup (optional sticker entry)

Fast onboarding input.

4. Location permission screen

Clear explanation of proximity-based matching.

5. My Album (home screen)
progress
teams list
duplicate/missing summary
6. Team detail screen
grid of stickers
statuses:
owned
missing
duplicate
search bar for sticker codes
7. Add sticker bottom sheet
team selector
sticker code/number input
status selector
quick add again CTA
8. Matches list (CORE SCREEN)
ranked nearby collectors
match score
distance badge
mutual trade summary
9. Match detail screen
“You need from them”
“They need from you”
CTA: send trade request
10. Profile screen
settings
privacy
trade history
location settings
UI STYLE DIRECTION
clean, modern iOS feel
structured and functional over decorative
minimal gradients
soft visual hierarchy
strong use of spacing and grouping
focus on readability and fast scanning
SAMPLE CONTENT

Use realistic data:

Users:

Carlos
Ana
Mateo
Sofia

Teams:

Brazil
Portugal
Argentina
Canada
France

Distances:

0.4 mi
1.2 mi
2.5 mi

Sticker examples:

POR 3
CAN 19
BRA 45
ARG 12