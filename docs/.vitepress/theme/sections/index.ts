import type { SectionConfig } from './types'

import { aiSection } from './ai'
import { architectureSection } from './architecture'
import { golangSection } from './golang'
import { pythonSection } from './python'
import { rustSection } from './rust'
import { mysqlSection } from './mysql'
import { redisSection } from './redis'
import { kafkaSection } from './kafka'
import { etcdSection } from './etcd'
import { dockerSection } from './docker'
import { nginxSection } from './nginx'
import { k8sSection } from './k8s'
import { postgresqlSection } from './postgresql'
import { opsSection } from './ops'
import { gitSection } from './git'
import { toolsSection } from './tools'

export const sections: SectionConfig[] = [
  aiSection,
  architectureSection,
  golangSection,
  pythonSection,
  rustSection,
  mysqlSection,
  redisSection,
  kafkaSection,
  etcdSection,
  dockerSection,
  nginxSection,
  k8sSection,
  postgresqlSection,
  opsSection,
  gitSection,
  toolsSection,
]

export type { LandingLink, SectionLandingContent, SidebarGroup, SectionConfig } from './types'
export { quickNavLink } from './quick-nav'
export { homeTracks, homeHighlights, homePrinciples, learningOverviewTracks, learningOverviewGoals } from './home'
