<script>
	import { enhance } from '$app/forms';

	const { article, user } = $props();
</script>

<div class="article-preview" data-testid="article-preview">
	<div class="article-meta" data-testid="article-meta">
		<a href="/profile/@{article.author.username}" data-testid="article-author-link">
			<img src={article.author.image} alt={article.author.username} data-testid="article-author-img" />
		</a>

		<div class="info" data-testid="article-info">
			<a class="author" href="/profile/@{article.author.username}" data-testid="article-author-name">{article.author.username}</a>
			<span class="date" data-testid="article-date">{new Date(article.createdAt).toDateString()}</span>
		</div>

		{#if user}
			<form
				method="POST"
				action="/article/{article.slug}?/toggleFavorite"
				use:enhance={({ form }) => {
					// optimistic UI
					if (article.favorited) {
						article.favorited = false;
						article.favoritesCount -= 1;
					} else {
						article.favorited = true;
						article.favoritesCount += 1;
					}

					const button = form.querySelector('button');
					button.disabled = true;

					return ({ result, update }) => {
						button.disabled = false;
						if (result.type === 'error') update();
					};
				}}
				class="pull-xs-right"
				data-testid="article-favorite-form"
			>
				<input hidden type="checkbox" name="favorited" checked={article.favorited} />
				<button class="btn btn-sm {article.favorited ? 'btn-primary' : 'btn-outline-primary'}" data-testid="article-favorite-btn">
					<i class="ion-heart"></i>
					{article.favoritesCount}
				</button>
			</form>
		{/if}
	</div>

	<a href="/article/{article.slug}" class="preview-link" data-testid="article-link">
		<h1 data-testid="article-title">{article.title}</h1>
		<p data-testid="article-description">{article.description}</p>
		<span data-testid="article-read-more">Read more...</span>
		<ul class="tag-list" data-testid="article-tag-list">
			{#each article.tagList as tag}
				<li class="tag-default tag-pill tag-outline" data-testid="article-tag-item">{tag}</li>
			{/each}
		</ul>
	</a>
</div>
