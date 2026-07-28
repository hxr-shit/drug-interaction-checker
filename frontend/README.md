# Insight Med

Drug Interaction Checker UI Prompt

Role

Design a modern premium healthcare web application for a Drug Interaction & Organ Safety Checker.

The design should feel like a combination of:

 Apple Human Interface

 Linear.app

 Modern Healthcare SaaS

 AI-powered medical dashboard

 Biomedical research platform

DO NOT copy the reference images. Instead, extract their design language and adapt it into a unique product.

Overall Theme

Use the dark blue biomedical aesthetic inspired by the final reference.

Primary palette:

 Navy

 Midnight blue

 Deep indigo-blue

 Slate

 White

 Cyan accents

Avoid:

 Purple

 Violet

 Lavender

 Pink

 Magenta

 Yellow gradients

Support both Light Mode and Dark Mode with seamless switching.

Dark mode should be the primary experience.

Typography

Use typography inspired by the biomedical research website.

Large elegant headings

Modern geometric sans-serif

Suggested fonts:

 Space Grotesk

 Satoshi

 General Sans

 Plus Jakarta Sans

Use large typography similar to Apple.

Landing Page

Use the layout inspiration from the first reference.

Do NOT copy it literally.

Sections:

Navbar

Logo on left

Links:

 Home

 Drug Checker

 Documentation

 About

 API

Right side:

Theme Toggle

Github

Hero

Large heading

Example:

Understand Drug Interactions Before They Become Problems.

Subheading:

Explain interactions, affected organs, adverse effects, and biological mechanisms in language anyone can understand.

Instead of

"Begin the Journey"

replace CTA with

Enter the Drugs

Secondary button

Learn More

Hero Background

Replace the plain gradient with subtle biomedical visuals inspired by the second image.

Possible animated elements:

 flowing DNA helix

 molecular network

 protein mesh

 neural pathways

 microscopic particles

 soft blue wave animations

Very minimal.

No distracting graphics.

Left Side Features

Instead of wellness icons, use

✔ Interaction Detection

✔ Organ-specific Risk Analysis

✔ Mechanism Explanation

✔ Patient-friendly Reports

Drug Search

Below Hero

Large floating search card

Contains

Drug A

Drug B

Autocomplete

Swap button

Recent searches

Popular drugs

Animated search button

Loading Screen

Instead of spinner

Show AI pipeline

Searching databases

↓

Checking interaction

↓

Analyzing adverse effects

↓

Mapping affected organs

↓

Generating explanation

Animated progress

Results Dashboard

After clicking search, transition into a dashboard inspired by references 3 and 4.

Use glassmorphism with soft shadows.

Rounded cards.

Interactive widgets.

Card 1

Overall Risk

Large severity meter

Safe

Minor

Moderate

Major

Contraindicated

Animated radial gauge.

Card 2

Mechanism

Timeline animation

Drug A

↓

Enzyme

↓

Protein

↓

Interaction

↓

Outcome

Card 3

Organ Impact

Use a full human anatomical model similar to reference 3.

Clickable.

Hovering organs highlights them.

Affected organs glow.

Healthy organs remain neutral.

Since the backend uses MedDRA SOCs, support all 27 System Organ Classes (SOCs).

Clicking an organ opens:

 affected SOC

 explanation

 severity

 symptoms

 confidence

Card 4

Organ Cards

Each affected SOC becomes an expandable card.

Example

🩸 Blood and Lymphatic System

Severity

High

Explanation

Symptoms

Evidence

Card 5

Interaction Graph

Visual node graph

Drug A

↓

Protein

↓

Gene

↓

Organ

↓

Clinical Effect

Animated edges.

Card 6

Side Effects Comparison

Two-column layout

Drug A

Drug B

Shared adverse effects highlighted.

Unique effects separated.

Card 7

Recommendations

Green

Yellow

Red

Different cards

Examples

Monitor INR

Avoid Alcohol

Consult Physician

Emergency Warning

Card 8

Confidence

Confidence score

Sources used

DrugBank

DDInter

FAERS

OpenFDA

PubMed

Microinteractions

Everything should feel alive.

Examples

Hover lift

Floating cards

Smooth page transitions

Animated gradients

Organ glow

Button ripple

Search expansion

Elastic animations

Scroll reveal

Parallax background

Glass reflections

Animated charts

Smooth counters

Dashboard Navigation

Left sidebar

Dashboard

Search

History

Saved Reports

Documentation

Settings

Extra Interactive Features

Hovering a body organ highlights every card related to it.

Hovering a side effect highlights the organ.

Hovering the interaction graph highlights corresponding pathways.

Filtering by

Severity

SOC

Mechanism

Confidence

Color System

Primary

Blue

Cyan

Slate

Success

Green

Warning

Amber

Danger

Red

Neutral

Gray

Avoid all purple shades.

Design Language

Very premium.

Very clean.

Minimal.

Lots of whitespace.

Rounded corners (20–24 px).

Soft shadows.

Glassmorphism where appropriate.

Apple-level animations.

No clutter.

Responsiveness

Desktop-first.

Also fully responsive for

Tablet

Mobile

Collapsible sidebar

Adaptive cards

Responsive anatomical viewer.

Technical Stack

React + Vite

Tailwind CSS

shadcn/ui

Framer Motion

Lucide Icons

TanStack Query

React Router

React Three Fiber (optional for animated DNA or 3D anatomical model)

Goal

The application should feel like a next-generation AI biomedical platform, combining the polish of Apple, the interaction quality of Linear, and the scientific credibility of modern healthcare software. It should be visually impressive while remaining intuitive, with the interactive anatomical viewer (27 MedDRA SOCs) serving as the centerpiece of the drug interaction analysis experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/77944ac3-f818-4570-b33c-8b997f379da7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
