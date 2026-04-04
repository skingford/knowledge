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

export interface SidebarItem {
  text: string;
  link: string;
  items?: SidebarItem[];
}

export interface SidebarGroup {
  text: string
  collapsed?: boolean
  items: SidebarItem[]
}

export type SidebarEntry = SidebarGroup | SidebarItem

export interface SectionConfig {
  key: string
  base: string
  navText: string
  overviewDescription: string
  landing: SectionLandingContent
  sidebar: SidebarEntry[]
}
