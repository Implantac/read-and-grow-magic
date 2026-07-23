export interface NavChild {
  title: string;
  href: string;
  icon: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  children?: NavChild[];
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}
