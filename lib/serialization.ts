export function serializeIdea(idea: {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  status: string;
  voteCount: number;
  reportCount: number;
  commentsCount: number;
  submittedAt: Date;
  publishedAt: Date | null;
  tags: { label: string }[];
  submitter: { id: string; name: string };
}) {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    imagePath: idea.imagePath,
    status: idea.status,
    voteCount: idea.voteCount,
    reportCount: idea.reportCount,
    commentsCount: idea.commentsCount,
    submittedAt: idea.submittedAt.toISOString(),
    publishedAt: idea.publishedAt?.toISOString() || null,
    tags: idea.tags.map((tag) => tag.label),
    submitter: idea.submitter
  };
}
