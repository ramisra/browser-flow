"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Tree from "react-d3-tree";

interface TreeNode {
  name: string;
  attributes?: Record<string, string>;
  children?: TreeNode[];
}

interface KnowledgeGraphProps {
  data: TreeNode[];
  onNodeClick?: (node: any) => void;
  selectedRootId?: string;
  highlightNodeIds?: Set<string> | string[];
}

export default function KnowledgeGraph({
  data,
  onNodeClick,
  selectedRootId,
  highlightNodeIds,
}: KnowledgeGraphProps) {
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const highlightSet = useMemo(() => {
    if (!highlightNodeIds) return new Set<string>();
    return Array.isArray(highlightNodeIds)
      ? new Set(highlightNodeIds)
      : highlightNodeIds;
  }, [highlightNodeIds]);

  useEffect(() => {
    if (!treeContainerRef.current) return;
    const container = treeContainerRef.current;
    const updateTranslate = () => {
      const { width } = container.getBoundingClientRect();
      const nextTranslate = {
        x: Math.max(width / 2, 200),
        y: 60,
      };
      setTranslate(nextTranslate);
    };

    updateTranslate();
    const observer = new ResizeObserver(() => updateTranslate());
    observer.observe(container);
    return () => observer.disconnect();
  }, [data, selectedRootId]);

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
        translate={translate}
        nodeSize={{ x: 200, y: 150 }}
        separation={{ siblings: 1, nonSiblings: 1.5 }}
        renderCustomNodeElement={(rd3tProps: any) => {
          const { nodeDatum } = rd3tProps;
          const contextId = nodeDatum.attributes?.context_id;
          const isHighlighted =
            contextId && highlightSet.size > 0 ? highlightSet.has(contextId) : true;
          const nodeOpacity = selectedRootId ? (isHighlighted ? 1 : 0.35) : 1;
          return (
            <g>
              {contextId && (
                <title>{`Context ID: ${contextId}\nClick to view raw context`}</title>
              )}
              <circle
                r={15}
                fill={
                  nodeDatum.attributes?.context_type === "text"
                    ? "var(--accent-blue)"
                    : nodeDatum.attributes?.context_type === "image"
                      ? "var(--accent-green)"
                      : "var(--accent-orange)"
                }
                stroke={isHighlighted ? "var(--accent-blue)" : "var(--border-color)"}
                strokeWidth={isHighlighted ? 3 : 2}
                onClick={() => onNodeClick?.(nodeDatum)}
                style={{ cursor: "pointer", opacity: nodeOpacity }}
              />
              <text
                x={0}
                y={-25}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="12"
                fontWeight={500}
                opacity={nodeOpacity}
              >
                {nodeDatum.name?.substring(0, 30) || "Context"}
              </text>
              {(() => {
                const urlStr = nodeDatum.attributes?.url;
                if (!urlStr || typeof urlStr !== "string") return null;
                try {
                  const url = new URL(urlStr);
                  return (
                    <text
                      x={0}
                      y={-10}
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize="10"
                      opacity={nodeOpacity}
                    >
                      {url.hostname}
                    </text>
                  );
                } catch {
                  return null;
                }
              })()}
            </g>
          );
        }}
        styles={{
          links: {
            stroke: selectedRootId ? "rgba(59, 130, 246, 0.4)" : "var(--accent-blue)",
            strokeWidth: 2,
            fill: "none",
          },
        }}
      />
    </div>
  );
}
