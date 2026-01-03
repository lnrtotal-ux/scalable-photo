-- PhotoShare Database Schema
-- Simplified schema for username/password authentication

-- Users Table
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'consumer' CHECK (Role IN ('consumer', 'creator', 'admin')),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    INDEX IX_Users_Username (Username),
    INDEX IX_Users_Email (Email)
);

-- Photos Table
CREATE TABLE Photos (
    PhotoId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Caption NVARCHAR(1000),
    Location NVARCHAR(200),
    BlobUrl NVARCHAR(500) NOT NULL,
    ThumbnailUrl NVARCHAR(500),
    LikesCount INT NOT NULL DEFAULT 0,
    CommentsCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_Photos_UserId (UserId),
    INDEX IX_Photos_CreatedAt (CreatedAt DESC)
);

-- Likes Table
CREATE TABLE Likes (
    LikeId INT IDENTITY(1,1) PRIMARY KEY,
    PhotoId INT NOT NULL,
    UserId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (PhotoId) REFERENCES Photos(PhotoId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE NO ACTION,
    UNIQUE (PhotoId, UserId),
    INDEX IX_Likes_PhotoId (PhotoId),
    INDEX IX_Likes_UserId (UserId)
);

-- Comments Table
CREATE TABLE Comments (
    CommentId INT IDENTITY(1,1) PRIMARY KEY,
    PhotoId INT NOT NULL,
    UserId INT NOT NULL,
    CommentText NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (PhotoId) REFERENCES Photos(PhotoId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE NO ACTION,
    INDEX IX_Comments_PhotoId (PhotoId),
    INDEX IX_Comments_CreatedAt (CreatedAt DESC)
);

-- Insert default admin user (password: Admin123!)
-- Password hash for 'Admin123!' - you should change this after first login
INSERT INTO Users (Username, Email, PasswordHash, Role) 
VALUES (
    'admin',
    'admin@photoshare.local',
    '$2a$10$T1AvT5wFib5NpNqYYC7pxOXDIuuTXzLU5p72XLjagK4n7kxpo5qVe',
    'admin'
);

-- Insert sample creator user (password: Creator123!)
INSERT INTO Users (Username, Email, PasswordHash, Role) 
VALUES (
    'john_creator',
    'john@photoshare.local',
    '$2a$10$GbqVpzG.zFWZKzMn5avrIu7iASoEFn1zaNtl35KmAaT1brgLeXGVu',
    'creator'
);

-- Insert sample consumer user (password: User123!)
INSERT INTO Users (Username, Email, PasswordHash, Role) 
VALUES (
    'jane_user',
    'jane@photoshare.local',
    '$2a$10$4YdAL6afFymSk6MeWo1aaueYwpaBYXlBu0G/6d9Nbl4YrgQlHTu9W',
    'consumer'
);
