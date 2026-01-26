declare module "react-d3-tree" {
  import { Component } from "react";

  export interface RawNodeDatum {
    name: string;
    attributes?: Record<string, string>;
    children?: RawNodeDatum[];
  }

  export interface TreeProps {
    data: RawNodeDatum | RawNodeDatum[];
    orientation?: "horizontal" | "vertical";
    pathFunc?: "straight" | "elbow" | "step" | "diagonal";
    translate?: { x: number; y: number };
    nodeSize?: { x: number; y: number };
    separation?: { siblings: number; nonSiblings: number };
    renderCustomNodeElement?: (props: any) => React.ReactElement;
    styles?: {
      links?: {
        stroke?: string;
        strokeWidth?: number;
        fill?: string;
      };
    };
  }

  export default class Tree extends Component<TreeProps> {}
}
