from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CommunityCommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=500)
    author: Optional[str] = "Anonymous Farmer"


class CommunityCommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: Optional[int] = None
    content: str
    author: str
    created_at: datetime


class CommunityPostCreate(BaseModel):
    title: Optional[str] = None
    content: str = Field(min_length=1, max_length=2000)
    author: Optional[str] = "Anonymous Farmer"
    location: Optional[str] = "भारत"
    media_url: Optional[str] = None
    post_type: str = "text"
    tags: List[str] = Field(default_factory=list)
    crop_tags: List[str] = Field(default_factory=list)
    lat: Optional[float] = None
    lon: Optional[float] = None


class CommunityPostUpdate(BaseModel):
    content: Optional[str] = Field(default=None, min_length=1, max_length=2000)
    media_url: Optional[str] = None
    tags: Optional[List[str]] = None
    crop_tags: Optional[List[str]] = None


class CommunityPostResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    author: str
    location: str
    content: str
    media_url: Optional[str] = None
    post_type: str
    tags: List[str] = Field(default_factory=list)
    crop_tags: List[str] = Field(default_factory=list)
    moderation_status: str
    views_count: int
    likes_count: int
    comments_count: int
    is_pinned: bool
    created_at: datetime
    comments: List[CommunityCommentResponse] = Field(default_factory=list)


class CommunityFeedResponse(BaseModel):
    posts: List[CommunityPostResponse]
    page: int
    size: int
    total: int


class CommunityReportCreate(BaseModel):
    reason: str = Field(min_length=3, max_length=100)
    details: Optional[str] = Field(default=None, max_length=500)
