/**
 * Single source of truth for every piece of copy, link and asset on the site.
 *
 * Contact details below are placeholders — replace them with your real ones.
 */

export type BadgeRow = { label: string; value: string };

export type Badge = {
  title: string[];
  year: string;
  role: string;
  rows: BadgeRow[];
};

export type Site = {
  name: string;
  shortName: string;
  title: string;
  tagline: string;
  heroTagline: string;
  location: string;
  watermark: string;
  script: string;
  hint: string;
  year: string;
  tags: {
    about: string;
    work: string;
    awards: string;
    contact: string;
  };
  badge: Badge;
};

export type Assets = {
  cut: string;
  idPhoto: string;
};

export type Project = {
  slug: string;
  name: string;
  /** Short title for the white case ticket. Keep it under ~13 characters. */
  ticketTitle: string;
  category: string;
  context: string;
  year: string;
  description: string;
  stack: string[];
  /** Replace with the real URL, or null to hide the link. */
  liveUrl: string | null;
  /** Replace with the real URL, or null to hide the link. */
  repoUrl: string | null;
  /** Shown in the hero case showcase (first three, flagship first). */
  featured?: boolean;
  /** Marks the lead case on the work grid. */
  flagship?: boolean;
  /** Optional screenshot in `public/`, e.g. "/projects/fixmo-ph.webp". */
  preview?: string;
};

export type ExperienceItem = {
  role: string;
  org: string;
  period: string;
  description: string;
};

export type SkillGroup = { group: string; items: string[] };

export type Award = {
  date: string;
  title: string;
  detail: string;
  /**
   * Optional certificate thumbnail in `public/`, e.g.
   * "/certificates/service-awardee-2026.jpg" — drop the file there and set it.
   */
  thumb?: string;
};

export type Activity = { title: string; description: string };

export type Fact = { label: string; value: string };

export type ContactChannel = {
  label: string;
  value: string;
  href: string;
};

export type Portfolio = {
  site: Site;
  assets: Assets;
  about: { paragraphs: string[]; facts: Fact[] };
  experience: ExperienceItem[];
  projects: Project[];
  skills: SkillGroup[];
  awards: Award[];
  community: Activity[];
  creative: Activity[];
  contact: ContactChannel[];
};

export const portfolio: Portfolio = {
  site: {
    name: 'Jessie M. Yurong Jr.',
    shortName: 'Jessie Yurong',
    title: 'Full-Stack Web Developer',
    tagline: 'I build web apps, systems, and tools for real clients and communities.',
    heroTagline:
      "BSIT student from Negros Occidental. I've fixed 100+ phones and build systems for repair shops and a youth org.",
    location: 'Mabinay, Negros Oriental, Philippines',
    watermark: 'JESSIE YURONG',
    script: 'full-stack',
    hint: 'scroll into the work',
    year: '2026',
    tags: {
      about: 'about me',
      work: 'portfolio',
      awards: 'awards',
      contact: 'discuss a project',
    },
    badge: {
      title: ['DEVELOPER', 'CARD'],
      year: '2026',
      role: 'FULL-STACK // WEB DEVELOPER',
      rows: [
        { label: 'NAME', value: 'JESSIE YURONG' },
        { label: 'FOCUS', value: 'WEB SYSTEMS' },
        { label: 'LOCATION', value: 'Negros Occidental, PH' },
        { label: 'EMAIL', value: 'jessieyurong444@gmail.com' },
      ],
    },
  },

  assets: {
    cut: '/portrait-hd.png',
    idPhoto: '/e.png',
  },

  about: {
    paragraphs: [
      'I am a third-year BSIT student at CPSU Main Campus. I started with basic HTML and CSS and moved into full-stack development, building POS systems, organization management systems, and web apps.',
      'I also work on hardware-integrated projects, repair cellphones (over 100 devices fixed so far), write, and take part in community work.',
    ],
    facts: [
      { label: 'Location', value: 'Mabinay, Negros Oriental, Philippines' },
      { label: 'Currently', value: '3rd-year BSIT, CPSU Main Campus' },
      { label: 'Focus', value: 'Full-stack web development' },
      { label: 'Also', value: 'Cellphone repair, writing, community work' },
    ],
  },

  experience: [
    {
      role: 'Part-time',
      org: 'Cynex Technology Corp (formerly KERR IT Solutions)',
      period: 'Saturdays',
      description: 'Part-time role at a technology company, scheduled every Saturday.',
    },
    {
      role: 'Cellphone Repair Technician',
      org: 'Home-based repair business',
      period: 'About 2 years',
      description: 'Repair and diagnostics for walk-in clients. More than 100 devices fixed.',
    },
    {
      role: 'Freelance Web Developer',
      org: 'Art shop client',
      period: 'Freelance',
      description: 'Built a simple web app and a landing page for an art shop.',
    },
  ],

  projects: [
    {
      slug: 'fixmo-ph',
      name: 'FixMo PH',
      ticketTitle: 'FIXMO PH',
      category: 'POS + Repair Tracking',
      context: 'REPAIR SHOP',
      year: '2026',
      description:
        'POS system with live repair status tracking, so clients can check where their device is in the repair process.',
      stack: [],
      liveUrl: null,
      repoUrl: null,
      featured: true,
      flagship: true,
      preview: '/projects/fixmo-ph.png',
    },
    {
      slug: 'jegz-repair-pro',
      name: 'JEGZ Repair Pro',
      ticketTitle: 'JEGZ REPAIR',
      category: 'POS System',
      context: 'REPAIR SHOP',
      year: '2026',
      description:
        'POS for a repair shop, covering sales, inventory, repairs, technicians, cash drawer, defective items, and backjobs.',
      stack: ['React', 'TypeScript', 'Express', 'PostgreSQL', 'Vercel', 'Neon'],
      liveUrl: null,
      repoUrl: null,
      featured: true,
      preview: '/projects/jegz-repair-pro.png',
    },
    {
      slug: 'winter-arc',
      name: 'Winter Arc',
      ticketTitle: 'WINTER ARC',
      category: 'Social PWA',
      context: 'FRIEND GROUPS',
      year: '2026',
      description:
        'Mobile-first social habit tracker for friend groups, with private rooms, streaks, XP, leaderboards, challenges, and chat.',
      stack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Supabase', 'Google Auth', 'Vercel'],
      liveUrl: null,
      repoUrl: null,
      featured: true,
      preview: '/projects/winter-arc.png',
    },
    {
      slug: 'pyap-management',
      name: 'PYAP Organization Management System',
      ticketTitle: 'PYAP SYSTEM',
      category: 'Organization System',
      context: 'PYAP SAMAC',
      year: '2026',
      description:
        'Member management system for a youth organization, with an admin approval flow for new members.',
      stack: [
        'React',
        'TypeScript',
        'TanStack Start',
        'Tailwind',
        'shadcn/ui',
        'Supabase',
        'Postgres',
        'Auth',
        'RLS',
        'PWA',
      ],
      liveUrl: null,
      repoUrl: null,
      featured: true,
      preview: '/projects/pyap-management.jpg',
    },
    {
      slug: 'anti-stress-playground',
      name: 'Anti-Stress Playground',
      ticketTitle: 'ANTI-STRESS',
      category: 'Web App',
      context: 'PERSONAL',
      year: '2026',
      description:
        'Stress-relief web app built around Mochi, a strawberry mascot, with Gemini-powered voice chat.',
      stack: ['Next.js', 'Gemini API', 'Vercel'],
      liveUrl: null,
      repoUrl: null,
      preview: '/projects/anti-stress-playground.jpg',
    },
    {
      slug: 'department-ai-assistant',
      name: 'Department AI Chat Assistant',
      ticketTitle: 'DEPT AI',
      category: 'AI Assistant',
      context: 'SCHOOL PROJECT',
      year: '2025',
      description:
        'Gemini-powered chat assistant with a custom knowledge base, built as a school project.',
      stack: ['React', 'Node.js', 'Gemini API'],
      liveUrl: null,
      repoUrl: null,
    },
    {
      slug: 'easy-file-organizer',
      name: 'Easy File Organizer Pro',
      ticketTitle: 'FILE ORGANIZER',
      category: 'Desktop App',
      context: 'PERSONAL TOOL',
      year: '2025',
      description: 'Windows desktop app that sorts files into folders automatically.',
      stack: ['Python', 'CustomTkinter'],
      liveUrl: null,
      repoUrl: null,
    },
  ],

  skills: [
    { group: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'] },
    { group: 'Backend', items: ['Node.js', 'Express', 'PostgreSQL', 'Firebase', 'Supabase'] },
    { group: 'Deployment', items: ['Vercel', 'Neon', 'GitHub'] },
    { group: 'Tools & AI', items: ['Cursor', 'VS Code', 'Photoshop', 'Antigravity', 'Google Stitch', 'v0'] },
    { group: 'Hardware', items: ['ESP32', 'Arduino'] },
    {
      group: 'Other',
      items: [
        'Cellphone repair and diagnostics',
        'Basic graphic design & sublimation',
        'Video content creation',
      ],
    },
  ],

  awards: [
    {
      date: 'May 18, 2026',
      title: 'Service Awardee',
      detail: 'Pasidungog 2026, CPSU',
    },
    {
      date: 'May 18, 2026',
      title: 'Leadership Award',
      detail: 'BSIT 2, CPSU 80th Recognition Day',
    },
    {
      date: 'May 18, 2026',
      title: 'With High Honors',
      detail: 'BSIT 2, GWA 1.50, CPSU 80th Recognition Day',
    },
    {
      date: 'May 29–31, 2026',
      title: 'Certificate of Completion',
      detail: '5th Mabinay Municipal Youth Leadership Summit',
    },
    {
      date: 'March 17, 2026',
      title: 'Certificate of Appreciation',
      detail: 'Graphic Designer of the Fiesta Singing Contest, Brgy. Samac Proper B',
    },
    {
      date: 'December 5, 2025',
      title: 'Certificate of Participation',
      detail: 'Bayanihan Minds Youth FGD & Local Action Day',
    },
    {
      date: 'SY 2024–2025',
      title: 'With High Honors',
      detail: 'BSIT 1, GWA 1.50, CPSU',
    },
    {
      date: 'SY 2023–2024',
      title: 'With Honors',
      detail: 'Mabinay National High School, 91% average',
    },
  ],

  community: [
    {
      title: 'Officer, PYAP Barangay Samac',
      description:
        'Officer of the Pag-asa Youth Association of the Philippines, Barangay Samac chapter.',
    },
    {
      title: 'Fiesta Singing Contest — Brgy. Samac Proper B',
      description:
        'Organized the contest in March 2026 and prepared the certificates, judging criteria, score sheets, and promo materials.',
    },
    {
      title: 'Fiesta sa Ani Singing Contest — Brgy. Samac Proper A',
      description: 'Organizing the singing contest for November 30, 2026.',
    },
    {
      title: 'Church ministry and community organizing',
      description: 'Active in church ministry and local community organizing.',
    },
  ],

  creative: [
    {
      title: 'Author — "Letters I Never Sent"',
      description:
        'A 12-chapter book with 3 printed hard copies since 2025, with plans to officially release on publishing platforms soon.',
    },
    {
      title: 'Graphic design',
      description:
        'Designs basic publication materials (pubmats) and basic sublimation layouts in Photoshop.',
    },
    {
      title: 'Drawing and painting',
      description: 'Creates drawings and paintings in traditional and digital media.',
    },
    {
      title: 'Guitarist and songwriter',
      description: 'Plays guitar and writes original OPM songs, including "Until the Time is Right".',
    },
    {
      title: 'Content creator',
      description: 'Creates video content for TikTok and Reels.',
    },
  ],

  // Placeholder contact details — replace before publishing.
  contact: [
    { label: 'Email', value: 'your-email@example.com', href: 'mailto:your-email@example.com' },
    { label: 'GitHub', value: '@your-github', href: 'https://github.com/your-github' },
    { label: 'LinkedIn', value: '/in/your-linkedin', href: 'https://www.linkedin.com/in/your-linkedin' },
    { label: 'TikTok', value: '@your-tiktok', href: 'https://www.tiktok.com/@your-tiktok' },
    { label: 'Facebook', value: '/your-facebook', href: 'https://www.facebook.com/your-facebook' },
    { label: 'Phone', value: '+63 900 000 0000', href: 'tel:+639000000000' },
  ],
};
