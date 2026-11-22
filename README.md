# Vaultbreak — The Meridian Job

[![Heist game](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/adhiejoey/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/adhiejoey/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

An original top-down heist game built for the make.fun best heist game bounty.

**The job:** one night, one diamond, no witnesses. Sneak through the Aurum
Bank as Rook the thief: slip past three patrolling guards and their vision
cones, dodge the sweeping CCTV cameras, grab the Meridian Diamond from the
vault — plus any gold, cash and art you can carry — and slip out the green
EXIT before the alarm hits 100%.

**How it plays**

- **WASD / arrows** to move, **Shift** to sprint (fast, but loud — nearby
  guards hear it and come to look).
- **Click** to throw a coin: the clink pulls the nearest guard over to
  investigate, opening a window to slip past.
- **Alarm meter:** rises while any guard or camera sees you, falls again
  when you break line of sight. At 100% the vault seals — lockdown.
- **Cover:** crates, desks and planters block sight. Read the cones,
  time the patrols, then move.
- **Win:** diamond in hand, standing in the EXIT. Rating from Ghost
  (never noticed) to Loud & Proud.

**Tech:** plain static files under `game/` (ES modules, no libraries, no
network requests), procedural WebAudio sounds, deterministic staged
screenshots via `?shot=cover|patrol|alert|exit`. Serve `game/` with any
static server and open `index.html` in a desktop browser.

Built with Muse for the make.fun bounty. Referral: https://make.fun/r/mcpf7r82
