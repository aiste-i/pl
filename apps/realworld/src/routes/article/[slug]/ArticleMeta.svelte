<script>
	import { enhance } from '$app/forms';

	const { article, user } = $props();
</script>

<div class="article-meta" data-testid="article-meta">
	<a href="/profile/@{article.author.username}" data-testid="article-author-link">
		<img src={article.author.image} alt={article.author.username} data-testid="article-author-img" />
	</a>

	<div class="info" data-testid="article-info">
		<a href="/profile/@{article.author.username}" class="author" data-testid="article-author-name">{article.author.username}</a>
		<span class="date" data-testid="article-date">
			{new Date(article.createdAt).toDateString()}
		</span>
	</div>

	{#if article.author.username === user?.username}
		<span data-testid="article-actions-owner">
			<a href="/editor/{article.slug}" class="btn btn-outline-secondary btn-sm" data-testid="article-edit-btn">
				<i class="ion-edit"></i> Edit Article
			</a>

			<form use:enhance method="POST" action="?/deleteArticle" data-testid="article-delete-form">
				<button class="btn btn-outline-danger btn-sm" data-testid="article-delete-btn">
					<i class="ion-trash-a"></i> Delete Article
				</button>
			</form>
		</span>
	{/if}
</div>
