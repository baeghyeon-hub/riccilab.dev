export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  tech: string[];
  link?: string;
  github?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "project-alpha",
    title: "PROJECT ALPHA",
    category: "WEB APP",
    description: "인터랙티브 데이터 시각화 플랫폼. 실시간 데이터 스트림을 아름다운 차트로 변환합니다.",
    tech: ["React", "D3.js", "WebSocket", "Node.js"],
    link: "#",
    github: "#",
  },
  {
    id: "phantom-ui",
    title: "PHANTOM UI",
    category: "DESIGN SYSTEM",
    description: "미니멀 UI 컴포넌트 라이브러리. 타이포그래피 중심의 인터페이스 시스템.",
    tech: ["React", "TypeScript", "Storybook", "Tailwind"],
    link: "#",
    github: "#",
  },
  {
    id: "code-heist",
    title: "CODE HEIST",
    category: "OPEN SOURCE",
    description: "개발자 생산성을 높이는 CLI 도구 모음. 반복 작업을 자동화합니다.",
    tech: ["Rust", "CLI", "GitHub Actions"],
    github: "#",
  },
  {
    id: "motion-lab",
    title: "MOTION LAB",
    category: "CREATIVE CODING",
    description: "제너러티브 아트와 모션 그래픽 실험실. Canvas와 WebGL 기반 작품들.",
    tech: ["Three.js", "GLSL", "Canvas API"],
    link: "#",
  },
];
