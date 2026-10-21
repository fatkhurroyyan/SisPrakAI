"use client";

import React from "react";
import styles from "./TableSkeleton.module.css";

interface TableSkeletonProps {
  titleWidth?: number;
  pillCount?: number;
  subPillCount?: number;
  rowCount?: number;
}

export function TableSkeleton({
  titleWidth = 240,
  pillCount = 5,
  subPillCount = 4,
  rowCount = 7,
}: TableSkeletonProps) {
  return (
    <div className={styles.container}>
      {/* Top Bar with Title & Actions */}
      <div className={styles.topBar}>
        <div
          className={`${styles.shimmer} ${styles.titleSkeleton}`}
          style={{ width: `${titleWidth}px` }}
        />
        <div className={styles.actionControls}>
          <div className={`${styles.shimmer} ${styles.searchSkeleton}`} />
          <div className={`${styles.shimmer} ${styles.buttonSkeleton}`} />
          <div className={`${styles.shimmer} ${styles.buttonSkeleton}`} />
        </div>
      </div>

      {/* Primary Pill Tabs Skeleton */}
      <div className={styles.pillGroup}>
        {Array.from({ length: pillCount }).map((_, i) => (
          <div
            key={i}
            className={`${styles.shimmer} ${styles.pillSkeleton}`}
            style={{ width: `${80 + (i % 3) * 15}px` }}
          />
        ))}
      </div>

      {/* Sub Pill Tabs Skeleton */}
      <div className={styles.pillGroup}>
        {Array.from({ length: subPillCount }).map((_, i) => (
          <div
            key={i}
            className={`${styles.shimmer} ${styles.pillSkeleton}`}
            style={{ width: `${95 + (i % 2) * 25}px` }}
          />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={`${styles.shimmer} ${styles.thSkeleton}`} style={{ width: "12%" }} />
          <div className={`${styles.shimmer} ${styles.thSkeleton}`} style={{ width: "26%" }} />
          <div className={`${styles.shimmer} ${styles.thSkeleton}`} style={{ width: "15%" }} />
          <div className={`${styles.shimmer} ${styles.thSkeleton}`} style={{ width: "15%" }} />
          <div className={`${styles.shimmer} ${styles.thSkeleton}`} style={{ width: "15%" }} />
          <div className={`${styles.shimmer} ${styles.thSkeleton}`} style={{ width: "17%" }} />
        </div>

        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div key={rowIndex} className={styles.tableRow}>
            <div
              className={`${styles.shimmer} ${styles.tdCell}`}
              style={{ width: "12%", opacity: 0.85 }}
            />
            <div
              className={`${styles.shimmer} ${styles.tdCell}`}
              style={{
                width: `${20 + ((rowIndex * 7) % 15)}%`,
                opacity: 0.95,
              }}
            />
            <div
              className={`${styles.shimmer} ${styles.tdCell}`}
              style={{ width: "14%", opacity: 0.8 }}
            />
            <div
              className={`${styles.shimmer} ${styles.tdCell}`}
              style={{ width: "12%", opacity: 0.8 }}
            />
            <div
              className={`${styles.shimmer} ${styles.tdCell}`}
              style={{ width: "12%", opacity: 0.8 }}
            />
            <div
              className={`${styles.shimmer} ${styles.tdCell}`}
              style={{ width: "14%", opacity: 0.9 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Reusable skeleton rows designed to be injected inside an existing <tbody> element
 * during in-page sub-tab transitions.
 */
export function TableBodySkeleton({
  rows = 6,
  columns = 7,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className={styles.bodyRow}>
          {Array.from({ length: columns }).map((_, cIdx) => {
            // Determine column widths
            let widthPercent = 70;
            if (cIdx === 0) widthPercent = 65; // NIM or No
            else if (cIdx === 1) widthPercent = 85 + ((rIdx * 11) % 15); // Nama
            else widthPercent = 45 + ((cIdx * 9) % 30); // Stats or scores

            return (
              <td key={cIdx} style={{ padding: "16px" }}>
                <div
                  className={`${styles.shimmer} ${styles.bodyCell}`}
                  style={{ width: `${widthPercent}%` }}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
