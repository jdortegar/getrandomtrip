/**
 * Round-robins posts across authors, preserving each author's internal order
 * (typically most-recent-first). Prevents a prolific author's consecutive
 * posts from crowding out everyone else's at the front of a list.
 */
export function interleavePostsByAuthor<T>(
  posts: T[],
  getAuthorId: (post: T) => string,
): T[] {
  const buckets = new Map<string, T[]>();
  for (const post of posts) {
    const authorId = getAuthorId(post);
    const bucket = buckets.get(authorId);
    if (bucket) {
      bucket.push(post);
    } else {
      buckets.set(authorId, [post]);
    }
  }

  const authorBuckets = [...buckets.values()];
  const interleaved: T[] = [];
  for (let round = 0; interleaved.length < posts.length; round++) {
    for (const bucket of authorBuckets) {
      if (round < bucket.length) interleaved.push(bucket[round]!);
    }
  }
  return interleaved;
}
