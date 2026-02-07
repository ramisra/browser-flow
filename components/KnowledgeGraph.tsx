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
          color: "var(--landing-text-muted)",
        }}
      >
        No graph data available
      </div>
    );
  }

  const circleFill =
    (type: string) =>
    type === "text"
      ? "var(--landing-accent)"
      : type === "image"
        ? "var(--accent-green)"
        : "var(--accent-orange)";

  return (
    <div
      ref={treeContainerRef}
      className="knowledge-graph-container"
      style={{
        width: "100%",
        height: "600px",
        backgroundColor: "var(--landing-bg-card)",
        borderRadius: "1.25rem",
        border: "1px solid rgba(148, 163, 184, 0.08)",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
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
          const contextType = nodeDatum.attributes?.context_type || "text";
          const isHighlighted =
            contextId && highlightSet.size > 0 ? highlightSet.has(contextId) : true;
          const nodeOpacity = selectedRootId ? (isHighlighted ? 1 : 0.35) : 1;
          return (
            <g style={{ fill: "none" }}>
              {contextId && (
                <title>{`Context ID: ${contextId}\nClick to view raw context`}</title>
              )}
              <circle
                r={15}
                fill={circleFill(contextType)}
                stroke={isHighlighted ? "var(--landing-accent)" : "rgba(148, 163, 184, 0.3)"}
                strokeWidth={isHighlighted ? 3 : 2}
                onClick={() => onNodeClick?.(nodeDatum)}
                style={{ cursor: "pointer", opacity: nodeOpacity }}
              />
              <text
                x={0}
                y={-25}
                textAnchor="middle"
                fontSize="12"
                fontWeight={500}
                opacity={nodeOpacity}
                style={{ fill: "white" }}
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
                      fontSize="10"
                      opacity={nodeOpacity}
                      style={{ fill: "white" }}
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
            stroke: selectedRootId ? "var(--landing-accent-glow)" : "var(--landing-accent)",
            strokeWidth: 2,
            fill: "none",
          },
        }}
      />
    </div>
  );
}
