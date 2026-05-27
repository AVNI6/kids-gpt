/**
 * Relative time utility for formatting ISO timestamps (like updated_at)
 * into human-readable relative strings, designed for use in notifications
 * and activity feeds.
 */
export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "Just now";

  try {
    let formattedDateString = dateString.trim();

    // Automatically force parsing as UTC if database returned a timestamp without a timezone indicator
    if (
      !formattedDateString.endsWith("Z") &&
      !formattedDateString.includes("+") &&
      !/T.*-\d{2}:?\d{2}$/.test(formattedDateString)
    ) {
      // Replace space separator with standard 'T' separator if necessary
      formattedDateString = formattedDateString.replace(" ", "T");
      // Append standard UTC 'Z' indicator
      formattedDateString = `${formattedDateString}Z`;
    }

    const date = new Date(formattedDateString);
    const now = new Date();

    // Calculate the difference in seconds
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle future times or slight system clock drifts
    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ago`;
    }

    // For very old dates, return the short locale date string
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (err) {
    console.error("Error formatting relative time:", err);
    return "Just now";
  }
}
