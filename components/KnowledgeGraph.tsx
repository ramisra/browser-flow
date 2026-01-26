"use client";

import React, { useEffect, useRef } from "react";
import Tree from "react-d3-tree";

interface TreeNode {
  name: string;
  attributes?: Record<string, string>;
  children?: TreeNode[];
}

interface KnowledgeGraphProps {
  data: TreeNode[];
  onNodeClick?: (node: any) => void;
}

export default function KnowledgeGraph({
  data,
  onNodeClick,
}: KnowledgeGraphProps) {
  const treeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (treeContainerRef.current && data.length > 0) {
      // Center the tree on mount
      const dimensions = treeContainerRef.current.getBoundingClientRect();
      // Tree will auto-center, but we can adjust if needed
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "600px",
          color: "var(--text-muted)",
        }}
      >
        No graph data available
      </div>
    );
  }

  return (
    <div
      ref={treeContainerRef}
      style={{
        width: "100%",
        height: "600px",
        backgroundColor: "var(--bg-primary)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
      }}
    >
      <Tree
        data={data}
        orientation="vertical"
        pathFunc="straight"
        translate={{ x: 400, y: 50 }}
        nodeSize={{ x: 200, y: 150 }}
        separation={{ siblings: 1, nonSiblings: 1.5 }}
        renderCustomNodeElement={(rd3tProps: any) => {
          const { nodeDatum } = rd3tProps;
          return (
            <g>
              <circle
                r={15}
                fill={
                  nodeDatum.attributes?.context_type === "text"
                    ? "var(--accent-blue)"
                    : nodeDatum.attributes?.context_type === "image"
                      ? "var(--accent-green)"
                      : "var(--accent-orange)"
                }
                stroke="var(--border-color)"
                strokeWidth={2}
                onClick={() => onNodeClick?.(nodeDatum)}
                style={{ cursor: "pointer" }}
              />
              <text
                x={0}
                y={-25}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="12"
                fontWeight={500}
              >
                {nodeDatum.name?.substring(0, 30) || "Context"}
              </text>
              {nodeDatum.attributes?.url && (
                <text
                  x={0}
                  y={-10}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {new URL(nodeDatum.attributes.url).hostname}
                </text>
              )}
            </g>
          );
        }}
        styles={{
          links: {
            stroke: "var(--accent-blue)",
            strokeWidth: 2,
            fill: "none",
          },
        }}
      />
    </div>
  );
}
