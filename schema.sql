-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS analysis_view_logs CASCADE;
DROP TABLE IF EXISTS comment_upvotes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS songs CASCADE;

-- Create songs table
CREATE TABLE songs (
    song_id SERIAL PRIMARY KEY,
    artist VARCHAR(255) NOT NULL,
    track VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analyses table
CREATE TABLE analyses (
    analysis_id SERIAL PRIMARY KEY,
    song_id INTEGER REFERENCES songs(song_id),
    version INTEGER DEFAULT 1,
    ai_response JSONB,
    view_count INTEGER DEFAULT 0,
    original_analysis_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add self-referencing foreign key after table creation
ALTER TABLE analyses 
ADD CONSTRAINT fk_original_analysis 
FOREIGN KEY (original_analysis_id) 
REFERENCES analyses(analysis_id);

-- Create comments table
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analyses(analysis_id),
    text TEXT NOT NULL,
    upvote_count INTEGER DEFAULT 0,
    ip_address VARCHAR(45),
    parent_comment_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add self-referencing foreign key after table creation
ALTER TABLE comments 
ADD CONSTRAINT fk_parent_comment 
FOREIGN KEY (parent_comment_id) 
REFERENCES comments(comment_id);

-- Create comment_upvotes table
CREATE TABLE comment_upvotes (
    upvote_id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(comment_id),
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, ip_address)
);

-- Create analysis_view_logs table
CREATE TABLE analysis_view_logs (
    log_id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analyses(analysis_id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_songs_artist_track ON songs(artist, track);
CREATE INDEX idx_analyses_song_id ON analyses(song_id);
CREATE INDEX idx_comments_analysis_id ON comments(analysis_id);
CREATE INDEX idx_view_logs_analysis_id ON analysis_view_logs(analysis_id);
CREATE INDEX idx_comment_upvotes_comment_id ON comment_upvotes(comment_id);
CREATE INDEX idx_comment_upvotes_ip ON comment_upvotes(ip_address); 