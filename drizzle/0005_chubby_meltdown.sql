ALTER TABLE "waitlist_leads" ADD COLUMN "seeker_needs" jsonb DEFAULT '{"version":1,"groups":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "recruiter_needs" jsonb DEFAULT '{"version":1,"groups":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "lead_data_version" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist_leads" ADD COLUMN "last_meaningful_step" text DEFAULT 'email' NOT NULL;--> statement-breakpoint
UPDATE "waitlist_leads" AS lead
SET "seeker_needs" = jsonb_build_object(
  'version', 1,
  'groups', coalesce((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', definition.group_id,
        'selections', to_jsonb(selection_state.selections),
        'otherSelected', selection_state.other_selected,
        'customResponse', selection_state.custom_response
      )
      ORDER BY definition.display_order
    )
    FROM (VALUES
      ('creative_production', 1, ARRAY['video_editing','short_form_editing','long_form_editing','thumbnail_design','graphic_design','motion_graphics','animation','photography','videography','production_assistance','podcast_editing','audio_editing','sound_design']::text[]),
      ('writing_research', 2, ARRAY['scriptwriting','copywriting','content_writing','research','newsletter_writing','seo_writing','podcast_research','fact_checking']::text[]),
      ('social_community', 3, ARRAY['social_media_management','community_management','content_scheduling','audience_engagement','moderation','community_operations']::text[]),
      ('creator_channel_ops', 4, ARRAY['creator_management','channel_management','content_operations','project_coordination','executive_assistance','sponsorship_operations','publishing_operations']::text[]),
      ('strategy_growth', 5, ARRAY['content_strategy','youtube_strategy','instagram_strategy','growth_marketing','performance_marketing','seo','analytics','audience_insights','creator_partnerships','influencer_marketing','brand_partnerships']::text[]),
      ('business_technical', 6, ARRAY['sales','account_management','talent_management','product_management','web_development','no_code_automation','ai_workflow_automation','data_analysis']::text[])
    ) AS definition(group_id, display_order, allowed_values)
    CROSS JOIN LATERAL (
      SELECT
        coalesce(array_agg(value ORDER BY array_position(definition.allowed_values, value)) FILTER (WHERE value IS NOT NULL), '{}'::text[]) AS selections,
        lead."job_categories" @> ARRAY[definition.group_id || '_other']::text[]
          OR length(trim(coalesce(lead."job_category_others"->>definition.group_id, ''))) > 0 AS other_selected,
        nullif(trim(coalesce(lead."job_category_others"->>definition.group_id, '')), '') AS custom_response
      FROM unnest(lead."job_categories") AS value
      WHERE value = any(definition.allowed_values)
         OR value = definition.group_id || '_other'
    ) AS selection_state
    WHERE cardinality(selection_state.selections) > 0
       OR selection_state.other_selected
  ), '[]'::jsonb)
);--> statement-breakpoint
UPDATE "waitlist_leads" AS lead
SET "recruiter_needs" = jsonb_build_object(
  'version', 1,
  'groups', coalesce((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', definition.group_id,
        'selections', to_jsonb(selection_state.selections),
        'otherSelected', selection_state.other_selected,
        'customResponse', selection_state.custom_response
      )
      ORDER BY definition.display_order
    )
    FROM (VALUES
      ('creative_production', 1, ARRAY['video_editors','short_form_editors','long_form_editors','thumbnail_designers','graphic_designers','motion_designers','animators','photographers','videographers','production_assistants','podcast_editors','audio_editors','sound_designers']::text[]),
      ('writing_research', 2, ARRAY['scriptwriters','copywriters','content_writers','researchers','newsletter_writers','seo_writers','fact_checkers']::text[]),
      ('social_community', 3, ARRAY['social_media_managers','community_managers','moderators','content_schedulers','engagement_specialists']::text[]),
      ('creator_channel_ops', 4, ARRAY['creator_managers','channel_managers','operations_specialists','project_coordinators','executive_assistants','sponsorship_coordinators']::text[]),
      ('strategy_growth', 5, ARRAY['content_strategists','growth_marketers','performance_marketers','seo_specialists','analysts','partnership_specialists','influencer_marketing_specialists']::text[]),
      ('business_technical', 6, ARRAY['sales_specialists','account_managers','talent_managers','web_developers','automation_specialists','ai_workflow_builders']::text[])
    ) AS definition(group_id, display_order, allowed_values)
    CROSS JOIN LATERAL (
      SELECT
        coalesce(array_agg(value ORDER BY array_position(definition.allowed_values, value)) FILTER (WHERE value IS NOT NULL), '{}'::text[]) AS selections,
        lead."talent_categories" @> ARRAY[definition.group_id || '_other']::text[]
          OR length(trim(coalesce(lead."talent_category_others"->>definition.group_id, ''))) > 0 AS other_selected,
        nullif(trim(coalesce(lead."talent_category_others"->>definition.group_id, '')), '') AS custom_response
      FROM unnest(lead."talent_categories") AS value
      WHERE value = any(definition.allowed_values)
         OR value = definition.group_id || '_other'
    ) AS selection_state
    WHERE cardinality(selection_state.selections) > 0
       OR selection_state.other_selected
  ), '[]'::jsonb)
);--> statement-breakpoint
UPDATE "waitlist_leads"
SET "last_meaningful_step" = CASE
  WHEN "completion_status" = 'completed' OR "last_completed_step" >= 8 THEN 'completed'
  WHEN "last_completed_step" >= 7 THEN 'phone_verification'
  WHEN "last_completed_step" >= 6 THEN 'phone'
  WHEN "last_completed_step" >= 5 THEN 'context'
  WHEN "last_completed_step" >= 4 THEN 'email_verification'
  WHEN "last_completed_step" >= 3 THEN 'needs'
  WHEN "last_completed_step" >= 2 THEN 'role'
  ELSE 'email'
END;--> statement-breakpoint
CREATE INDEX "waitlist_leads_seeker_needs_gin_idx" ON "waitlist_leads" USING gin ("seeker_needs");--> statement-breakpoint
CREATE INDEX "waitlist_leads_recruiter_needs_gin_idx" ON "waitlist_leads" USING gin ("recruiter_needs");
