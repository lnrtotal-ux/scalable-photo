// Home page functionality
import api from './api.js';
import auth from './auth.js';

class HomePage {
    constructor() {
        this.currentPage = 1;
        this.searchQuery = '';
        this.currentPhoto = null;
        this.init();
    }

    init() {
        this.updateNav();
        this.attachEventListeners();
        this.loadPhotos();
    }

    updateNav() {
        const user = auth.getUser();
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const creatorNavItem = document.getElementById('creatorNavItem');

        if (auth.isAuthenticated()) {
            authButtons.classList.add('d-none');
            userMenu.classList.remove('d-none');
            document.getElementById('usernameDisplay').textContent = user.username;

            // Show creator nav item only for creators
            if (auth.isCreator()) {
                creatorNavItem.classList.remove('d-none');
            } else {
                creatorNavItem.classList.add('d-none');
            }
        } else {
            authButtons.classList.remove('d-none');
            userMenu.classList.add('d-none');
            creatorNavItem.classList.add('d-none');
        }
    }

    attachEventListeners() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });

        // Search
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.handleSearch();
        });

        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.searchQuery = '';
            this.currentPage = 1;
            this.loadPhotos();
        });
    }

    handleSearch() {
        this.searchQuery = document.getElementById('searchInput').value.trim();
        this.currentPage = 1;
        this.loadPhotos();
    }

    async loadPhotos() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const photosList = document.getElementById('photosList');
        const emptyState = document.getElementById('emptyState');
        const pagination = document.getElementById('pagination');

        try {
            loadingSpinner.classList.remove('d-none');
            photosList.innerHTML = '';
            emptyState.classList.add('d-none');

            const data = await api.getPhotos(this.currentPage, 12, this.searchQuery);

            loadingSpinner.classList.add('d-none');

            if (data.photos.length === 0) {
                emptyState.classList.remove('d-none');
                pagination.classList.add('d-none');
                return;
            }

            this.renderPhotos(data.photos);
            this.renderPagination(data.pagination);

        } catch (error) {
            loadingSpinner.classList.add('d-none');
            this.showError('Failed to load photos: ' + error.message);
        }
    }

    renderPhotos(photos) {
        const photosList = document.getElementById('photosList');
        photosList.innerHTML = '';

        photos.forEach(photo => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            col.innerHTML = `
                <div class="card photo-card h-100 shadow-sm" data-photo-id="${photo.PhotoId}">
                    <div class="row g-0">
                        <div class="col-5">
                            <img src="${photo.BlobUrl}" class="img-fluid rounded-start photo-thumbnail" alt="${photo.Title}">
                        </div>
                        <div class="col-7">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1">${this.escapeHtml(photo.Title)}</h6>
                                <p class="card-text small text-muted mb-2">
                                    <i class="fas fa-user"></i> ${this.escapeHtml(photo.Username)}
                                </p>
                                ${photo.Caption ? `<p class="card-text small mb-2">${this.escapeHtml(this.truncate(photo.Caption, 60))}</p>` : ''}
                                ${photo.Location ? `<p class="card-text small text-muted mb-2"><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(photo.Location)}</p>` : ''}
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="badge bg-light text-dark me-1">
                                            <i class="fas fa-heart text-danger"></i> ${photo.LikesCount}
                                        </span>
                                        <span class="badge bg-light text-dark">
                                            <i class="fas fa-comment"></i> ${photo.CommentsCount}
                                        </span>
                                    </div>
                                    <button class="btn btn-sm btn-primary view-photo-btn">
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            col.querySelector('.view-photo-btn').addEventListener('click', () => {
                this.showPhotoDetail(photo.PhotoId);
            });

            photosList.appendChild(col);
        });
    }

    renderPagination(pagination) {
        const paginationEl = document.getElementById('pagination');
        const paginationList = paginationEl.querySelector('.pagination');

        if (pagination.pages <= 1) {
            paginationEl.classList.add('d-none');
            return;
        }

        paginationEl.classList.remove('d-none');
        paginationList.innerHTML = '';

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${pagination.page === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#"><i class="fas fa-chevron-left"></i></a>`;
        if (pagination.page > 1) {
            prevLi.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage--;
                this.loadPhotos();
            });
        }
        paginationList.appendChild(prevLi);

        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === pagination.page ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = i;
                this.loadPhotos();
            });
            paginationList.appendChild(li);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#"><i class="fas fa-chevron-right"></i></a>`;
        if (pagination.page < pagination.pages) {
            nextLi.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage++;
                this.loadPhotos();
            });
        }
        paginationList.appendChild(nextLi);
    }

    async showPhotoDetail(photoId) {
        try {
            const photo = await api.getPhoto(photoId);
            this.currentPhoto = photo;
            
            const modal = new bootstrap.Modal(document.getElementById('photoDetailModal'));
            const modalTitle = document.getElementById('photoModalTitle');
            const modalBody = document.getElementById('photoModalBody');

            modalTitle.textContent = photo.Title;

            modalBody.innerHTML = `
                <div class="row">
                    <div class="col-md-7">
                        <img src="${photo.BlobUrl}" class="img-fluid rounded" alt="${photo.Title}">
                    </div>
                    <div class="col-md-5">
                        <div class="mb-3">
                            <h6><i class="fas fa-user"></i> ${this.escapeHtml(photo.Username)}</h6>
                            <small class="text-muted">${new Date(photo.CreatedAt).toLocaleDateString()}</small>
                        </div>
                        
                        ${photo.Caption ? `<p>${this.escapeHtml(photo.Caption)}</p>` : ''}
                        ${photo.Location ? `<p class="text-muted"><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(photo.Location)}</p>` : ''}
                        
                        <div class="mb-3">
                            <button class="btn ${photo.hasLiked ? 'btn-danger' : 'btn-outline-danger'} btn-sm me-2" id="likeBtn">
                                <i class="fas fa-heart"></i> <span id="likeCount">${photo.LikesCount}</span>
                            </button>
                            <span class="text-muted">
                                <i class="fas fa-comment"></i> ${photo.CommentsCount} comments
                            </span>
                        </div>

                        <!-- Comments -->
                        <div class="mt-4">
                            <h6>Comments</h6>
                            
                            ${auth.isAuthenticated() ? `
                                <div class="mb-3">
                                    <textarea class="form-control form-control-sm" id="commentInput" rows="2" placeholder="Add a comment..."></textarea>
                                    <button class="btn btn-primary btn-sm mt-2" id="addCommentBtn">
                                        <i class="fas fa-paper-plane"></i> Post
                                    </button>
                                </div>
                            ` : '<p class="text-muted small">Login to comment</p>'}
                            
                            <div id="commentsList" class="comments-list">
                                ${this.renderComments(photo.comments)}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add event listeners
            if (auth.isAuthenticated()) {
                document.getElementById('likeBtn')?.addEventListener('click', () => this.handleLike(photoId));
                document.getElementById('addCommentBtn')?.addEventListener('click', () => this.handleAddComment(photoId));
            }

            modal.show();

        } catch (error) {
            this.showError('Failed to load photo details: ' + error.message);
        }
    }

    renderComments(comments) {
        if (comments.length === 0) {
            return '<p class="text-muted small">No comments yet</p>';
        }

        return comments.map(comment => `
            <div class="comment mb-2 p-2 border-bottom">
                <div class="d-flex justify-content-between">
                    <strong class="small">${this.escapeHtml(comment.Username)}</strong>
                    ${auth.getUser()?.userId === comment.UserId ? `
                        <button class="btn btn-sm btn-link text-danger p-0 delete-comment-btn" data-comment-id="${comment.CommentId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <p class="small mb-0">${this.escapeHtml(comment.CommentText)}</p>
                <small class="text-muted">${new Date(comment.CreatedAt).toLocaleString()}</small>
            </div>
        `).join('');
    }

    async handleLike(photoId) {
        try {
            const result = await api.toggleLike(photoId);
            const likeBtn = document.getElementById('likeBtn');
            const likeCount = document.getElementById('likeCount');

            if (result.liked) {
                likeBtn.classList.remove('btn-outline-danger');
                likeBtn.classList.add('btn-danger');
            } else {
                likeBtn.classList.remove('btn-danger');
                likeBtn.classList.add('btn-outline-danger');
            }

            likeCount.textContent = result.likesCount;

        } catch (error) {
            this.showError('Failed to like photo: ' + error.message);
        }
    }

    async handleAddComment(photoId) {
        const commentInput = document.getElementById('commentInput');
        const commentText = commentInput.value.trim();

        if (!commentText) return;

        try {
            await api.addComment(photoId, commentText);
            commentInput.value = '';
            
            // Refresh photo details
            this.showPhotoDetail(photoId);

        } catch (error) {
            this.showError('Failed to add comment: ' + error.message);
        }
    }

    showError(message) {
        alert(message);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncate(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HomePage();
});
