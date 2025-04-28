// src/utils/report-utils.js

/**
 * Returns an array of the last 12 months in “Mon YYYY” format
 * e.g. ["May 2024", "Jun 2024", …, "Apr 2025"]
 */
export function generateLast12Months() {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i)
      return d.toLocaleString('default', { month: 'short', year: 'numeric' })
    })
  }
  
  /**
   * Returns an array of `count` random integers from 0 to (max-1)
   */
  export function generateMonthlyData(count, max) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * max))
  }
  
  /**
   * Returns an array of `count` objects
   * each with a label “${labelPrefix} i” and a random value
   */
  export function generateTopData(count, labelPrefix) {
    return Array.from({ length: count }, (_, i) => ({
      label: `${labelPrefix} ${i + 1}`,
      value: Math.floor(Math.random() * 1000)
    }))
  }
  