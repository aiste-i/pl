<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	const { children, data } = $props();

	const is_favorites = $derived($page.route.id === '/profile/@[user]/favorites');
</script>

<svelte:head>
	<title>{data.profile.username} • Conduit</title>
</svelte:head>

<div class="profile-page" data-testid="profile-page">
	<div class="user-info" data-testid="profile-user-info">
		<div class="container">
			<div class="row">
				<div class="col-xs-12 col-md-10 offset-md-1">
					<img src={data.profile.image} class="user-img" alt={data.profile.username} data-testid="profile-user-img" />
					<h4 data-testid="profile-username">{data.profile.username}</h4>
					{#if data.profile.bio}
						<p data-testid="profile-bio">{data.profile.bio}</p>
					{/if}

					{#if data.profile.username === data.user?.username}
						<a href="/settings" class="btn btn-sm btn-outline-secondary action-btn" data-testid="profile-edit-btn">
							<i class="ion-gear-a"></i>
							Edit Profile Settings
						</a>
					{:else if data.user}
						<form
							method="POST"
							action="/profile/@{data.profile.username}?/toggleFollow"
							use:enhance={({ form }) => {
								// optimistic UI
								data.profile.following = !data.profile.following;

								const button = form.querySelector('button');
								button.disabled = true;

								return ({ result, update }) => {
									button.disabled = false;
									if (result.type === 'error') update();
								};
							}}
							data-testid="profile-follow-form"
						>
							<input hidden type="checkbox" name="following" checked={data.profile.following} />
							<button
								class="btn btn-sm action-btn"
								class:btn-secondary={data.profile.following}
								class:btn-outline-secondary={!data.profile.following}
								data-testid="profile-follow-btn"
							>
								<i class="ion-plus-round"></i>
								{data.profile.following ? 'Unfollow' : 'Follow'}
								{data.profile.username}
							</button>
						</form>
					{:else}
						<a href="/login" data-testid="profile-login-to-follow">Sign in to follow</a>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="container">
		<div class="row">
			<div class="col-xs-12 col-md-10 offset-md-1">
				<div class="articles-toggle" data-testid="profile-tabs">
					<ul class="nav nav-pills outline-active">
						<li class="nav-item" data-testid="profile-tab-item-my-posts">
							<a
								href="/profile/@{data.profile.username}"
								class="nav-link"
								class:active={!is_favorites}
								data-testid="profile-tab-my-posts"
							>
								Articles
							</a>
						</li>

						<li class="nav-item" data-testid="profile-tab-item-favorited-posts">
							<a
								href="/profile/@{data.profile.username}/favorites"
								class="nav-link"
								class:active={is_favorites}
								data-testid="profile-tab-favorited-posts"
							>
								Favorites
							</a>
						</li>
					</ul>
				</div>

				<div data-testid="profile-article-list">
					{@render children()}
				</div>
			</div>
		</div>
	</div>
</div>
