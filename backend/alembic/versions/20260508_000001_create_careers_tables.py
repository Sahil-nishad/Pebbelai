"""create careers tables

Revision ID: 20260508_000001
Revises:
Create Date: 2026-05-08
"""

from alembic import op
import sqlalchemy as sa


revision = "20260508_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "resumes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("file_url", sa.String(length=500), nullable=False),
        sa.Column("parsed_name", sa.String(length=200), nullable=True),
        sa.Column("extracted_skills", sa.JSON(), nullable=False),
        sa.Column("extracted_projects", sa.JSON(), nullable=False),
        sa.Column("extracted_education", sa.JSON(), nullable=False),
        sa.Column("extracted_experience", sa.JSON(), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"])

    op.create_table(
        "recruiters",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("recruiter_name", sa.String(length=200), nullable=False),
        sa.Column("company", sa.String(length=200), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("linkedin_url", sa.String(length=500), nullable=True),
        sa.Column("designation", sa.String(length=160), nullable=True),
        sa.UniqueConstraint("email", name="uq_recruiters_email"),
    )

    op.create_table(
        "recruiter_posts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("recruiter_id", sa.String(length=36), sa.ForeignKey("recruiters.id", ondelete="SET NULL"), nullable=True),
        sa.Column("role", sa.String(length=200), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column("post_content", sa.Text(), nullable=False),
        sa.Column("extracted_skills", sa.JSON(), nullable=False),
        sa.Column("extracted_email_candidates", sa.JSON(), nullable=False),
        sa.Column("source_url", sa.String(length=1000), nullable=False),
        sa.Column("source_platform", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "gmail_connections",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scopes", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", name="uq_gmail_connections_user"),
    )
    op.create_index("ix_gmail_connections_user_id", "gmail_connections", ["user_id"])

    op.create_table(
        "applications",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("recruiter_id", sa.String(length=36), sa.ForeignKey("recruiters.id", ondelete="SET NULL"), nullable=True),
        sa.Column("recruiter_post_id", sa.String(length=36), sa.ForeignKey("recruiter_posts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("resume_id", sa.String(length=36), sa.ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("email_subject", sa.String(length=255), nullable=False),
        sa.Column("email_body", sa.Text(), nullable=False),
        sa.Column("match_percentage", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("missing_skills", sa.JSON(), nullable=False),
        sa.Column("match_summary", sa.Text(), nullable=True),
        sa.Column("sent_status", sa.String(length=50), nullable=False, server_default="draft"),
        sa.Column("reply_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("gmail_message_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_applications_user_id", table_name="applications")
    op.drop_table("applications")
    op.drop_index("ix_gmail_connections_user_id", table_name="gmail_connections")
    op.drop_table("gmail_connections")
    op.drop_table("recruiter_posts")
    op.drop_table("recruiters")
    op.drop_index("ix_resumes_user_id", table_name="resumes")
    op.drop_table("resumes")
