// Creator area functionality
import api from './api.js';
import auth from './auth.js';

class CreatorPage {
    constructor() {
        // Require creator authentication
        if (!auth.requireCreator()) return;

        this.currentEditPhoto = null;
        this.init();
    }

    init() {
        this.updateNav();
        this.attachEventListeners();
        this.loadMyPhotos();
    }

    updateNav() {
        const user = auth.getUser();
        document.getElementById('usernameDisplay').textContent = user.username;
    }

    attachEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });

        // Photo file preview
        document.getElementById('photoFile').addEventListener('change', (e) => {
            this.handleFilePreview(e.target.files[0]);
        });

        // Upload form
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpload();
        });

        // Edit photo save
        document.getElementById('saveEditBtn').addEventListener('click', () => {
            this.handleSaveEdit();
        });
    }

    handleFilePreview(file) {
        if (!file) return;

        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            preview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }

    async handleUpload() {
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadError = document.getElementById('uploadError');
        const uploadSuccess = document.getElementById('uploadSuccess');
        
        const photoFile = document.getElementById('photoFile').files[0];
        const title = document.getElementById('photoTitle').value.trim();
        const caption = document.getElementById('photoCaption').value.trim();
        const location = document.getElementById('photoLocation').value.trim();

        uploadError.classList.add('d-none');
        uploadSuccess.classList.add('d-none');

        if (!photoFile) {
            uploadError.textContent = 'Please select a photo';
            uploadError.classList.remove('d-none');
            return;
        }

        // Check file size (10MB)
        if (photoFile.size > 10 * 1024 * 1024) {
            uploadError.textContent = 'File size must be less than 10MB';
            uploadError.classList.remove('d-none');
            return;
        }

        try {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

            const formData = new FormData();
            formData.append('photo', photoFile);
            formData.append('title', title);
            formData.append('caption', caption);
            formData.append('location', location);

            await api.createPhoto(formData);

            uploadSuccess.textContent = 'Photo uploaded successfully!';
            uploadSuccess.classList.remove('d-none');

            // Reset form
            document.getElementById('uploadForm').reset();
            document.getElementById('imagePreview').classList.add('d-none');

            // Reload photos
            this.loadMyPhotos();

            // Hide success message after 3 seconds
            setTimeout(() => {
                uploadSuccess.classList.add('d-none');
            }, 3000);

        } catch (error) {
            uploadError.textContent = 'Upload failed: ' + error.message;
            uploadError.classList.remove('d-none');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Photo';
        }
    }

    async loadMyPhotos() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const photosList = document.getElementById('myPhotosList');
        const emptyState = document.getElementById('emptyState');

        try {
            loadingSpinner.classList.remove('d-none');
            photosList.innerHTML = '';
            emptyState.classList.add('d-none');

            const user = auth.getUser();
            const data = await api.getPhotos(1, 50, '', user.userId);

            loadingSpinner.classList.add('d-none');

            if (data.photos.length === 0) {
                emptyState.classList.remove('d-none');
                return;
            }

            this.renderMyPhotos(data.photos);

        } catch (error) {
            loadingSpinner.classList.add('d-none');
            this.showError('Failed to load photos: ' + error.message);
        }
    }

    renderMyPhotos(photos) {
        const photosList = document.getElementById('myPhotosList');
        photosList.innerHTML = '';

        photos.forEach(photo => {
            const col = document.createElement('div');
            col.className = 'col-md-6';
            col.innerHTML = `
                <div class="card mb-3">
                    <div class="row g-0">
                        <div class="col-4">
                            <img src="${photo.BlobUrl}" class="img-fluid rounded-start" alt="${photo.Title}" style="height: 150px; object-fit: cover;">
                        </div>
                        <div class="col-8">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-1">${this.escapeHtml(photo.Title)}</h6>
                                ${photo.Caption ? `<p class="card-text small mb-2">${this.escapeHtml(this.truncate(photo.Caption, 80))}</p>` : ''}
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
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-photo-btn" data-photo-id="${photo.PhotoId}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger delete-photo-btn" data-photo-id="${photo.PhotoId}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Edit button
            col.querySelector('.edit-photo-btn').addEventListener('click', () => {
                this.showEditModal(photo);
            });

            // Delete button
            col.querySelector('.delete-photo-btn').addEventListener('click', () => {
                this.handleDelete(photo.PhotoId, photo.Title);
            });

            photosList.appendChild(col);
        });
    }

    showEditModal(photo) {
        this.currentEditPhoto = photo;

        document.getElementById('editPhotoId').value = photo.PhotoId;
        document.getElementById('editTitle').value = photo.Title;
        document.getElementById('editCaption').value = photo.Caption || '';
        document.getElementById('editLocation').value = photo.Location || '';
        document.getElementById('editError').classList.add('d-none');

        const modal = new bootstrap.Modal(document.getElementById('editPhotoModal'));
        modal.show();
    }

    async handleSaveEdit() {
        const photoId = document.getElementById('editPhotoId').value;
        const title = document.getElementById('editTitle').value.trim();
        const caption = document.getElementById('editCaption').value.trim();
        const location = document.getElementById('editLocation').value.trim();
        const saveBtn = document.getElementById('saveEditBtn');
        const errorEl = document.getElementById('editError');

        errorEl.classList.add('d-none');

        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            await api.updatePhoto(photoId, { title, caption, location });

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPhotoModal'));
            modal.hide();

            // Reload photos
            this.loadMyPhotos();

        } catch (error) {
            errorEl.textContent = 'Failed to update: ' + error.message;
            errorEl.classList.remove('d-none');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    }

    async handleDelete(photoId, photoTitle) {
        if (!confirm(`Are you sure you want to delete "${photoTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.deletePhoto(photoId);
            this.loadMyPhotos();
            alert('Photo deleted successfully');

        } catch (error) {
            this.showError('Failed to delete photo: ' + error.message);
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
    new CreatorPage();
});
