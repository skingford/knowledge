export interface LandingLink {
  title: string
  href: string
  description: string
}

export interface SectionLandingContent {
  eyebrow: string
  title: string
  intro: string
  primary: LandingLink
  secondary?: LandingLink
  scope: string[]
  docs: LandingLink[]
  order: string[]
}

interface Items {
  text: string;
  link: string;
  items?: Items[];
}

export interface SidebarGroup {
  text: string
  collapsed?: boolean
  items: Items[]
}

export interface SectionConfig {
  key: string
  base: string
  navText: string
  overviewDescription: string
  landing: SectionLandingContent
  sidebar: SidebarGroup[]
}
