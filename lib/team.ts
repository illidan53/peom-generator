/** Our hackathon team, preloaded on every page for demos and testing. */
export type TeamMember = {
  name: string;
  linkedin: string;
  company?: string;
  role?: string;
  intro?: string;
};

export const DEMO_TEAM: TeamMember[] = [
  { name: "张然", linkedin: "https://www.linkedin.com/in/ran-zhang-daydreamer/" },
  { name: "赵声雷", linkedin: "https://www.linkedin.com/in/shengleizhao/" },
  { name: "非凡", linkedin: "https://www.linkedin.com/in/feifan/" },
  { name: "陈嘉倩", linkedin: "https://www.linkedin.com/in/jcclaire/" },
];

export const DEMO_EVENT = "Claude Workshop Hackathon";

/** One-line description for the homepage "About them" field. */
export function describe(m: TeamMember): string {
  return [m.role, m.company, m.intro, m.linkedin].filter(Boolean).join(", ");
}
