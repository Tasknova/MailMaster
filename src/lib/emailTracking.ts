// Email tracking utilities for adding tracking pixels and link tracking

export interface TrackingConfig {
  campaignId: string;
  recipientId: string;
  baseUrl: string;
}

/**
 * Add tracking pixel to email HTML content
 */
export function addTrackingPixel(htmlContent: string, config: TrackingConfig): string {
  const trackingPixelUrl = `${config.baseUrl}/track-open?c=${config.campaignId}&r=${config.recipientId}`;
  
  // Create tracking pixel HTML
  const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
  
  // Add tracking pixel before closing body tag
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${trackingPixel}\n</body>`);
  } else {
    // If no body tag, add at the end
    return htmlContent + trackingPixel;
  }
}

/**
 * Replace all links in email HTML with tracking links
 */
export function addLinkTracking(htmlContent: string, config: TrackingConfig): string {
  // Regular expression to find all href attributes
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  
  return htmlContent.replace(linkRegex, (match, originalUrl) => {
    // Skip if it's already a tracking link or unsubscribe link
    if (originalUrl.includes('/track-click') || originalUrl.includes('unsubscribe')) {
      return match;
    }
    
    // Create tracking URL
    const trackingUrl = `${config.baseUrl}/track-click?c=${config.campaignId}&r=${config.recipientId}&url=${encodeURIComponent(originalUrl)}`;
    
    // Replace the href with tracking URL
    return match.replace(`href="${originalUrl}"`, `href="${trackingUrl}"`);
  });
}

/**
 * Process email content to add all tracking elements
 */
export function processEmailForTracking(htmlContent: string, config: TrackingConfig): string {
  let processedContent = htmlContent;
  
  // Add link tracking first
  processedContent = addLinkTracking(processedContent, config);
  
  // Add tracking pixel
  processedContent = addTrackingPixel(processedContent, config);
  
  return processedContent;
}

/**
 * Generate unsubscribe link
 */
export function generateUnsubscribeLink(config: TrackingConfig): string {
  return `${config.baseUrl}/unsubscribe?c=${config.campaignId}&r=${config.recipientId}`;
}

/**
 * Add unsubscribe link to email footer
 */
export function addUnsubscribeLink(htmlContent: string, config: TrackingConfig): string {
  const unsubscribeUrl = generateUnsubscribeLink(config);
  const unsubscribeHtml = `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
      <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}" style="color: #0066cc;">unsubscribe here</a>.</p>
    </div>
  `;
  
  // Add before closing body tag
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${unsubscribeHtml}\n</body>`);
  } else {
    // If no body tag, add at the end
    return htmlContent + unsubscribeHtml;
  }
}

/**
 * Complete email processing with all tracking elements
 */
export function processCompleteEmail(htmlContent: string, config: TrackingConfig): string {
  let processedContent = htmlContent;
  
  // Add link tracking
  processedContent = addLinkTracking(processedContent, config);
  
  // Add unsubscribe link
  processedContent = addUnsubscribeLink(processedContent, config);
  
  // Add tracking pixel (last, so it's at the bottom)
  processedContent = addTrackingPixel(processedContent, config);
  
  return processedContent;
}

/**
 * Extract all links from HTML content
 */
export function extractLinks(htmlContent: string): string[] {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    links.push(match[1]);
  }
  
  return links;
}

/**
 * Validate tracking configuration
 */
export function validateTrackingConfig(config: TrackingConfig): boolean {
  return !!(config.campaignId && config.recipientId && config.baseUrl);
}
