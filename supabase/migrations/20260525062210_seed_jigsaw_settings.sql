-- Seed jigsaw-puzzle activity settings
INSERT INTO "public"."activity_settings" ("slug", "title", "xp_reward") 
VALUES ('jigsaw-puzzle', 'Jigsaw Puzzle', 120)
ON CONFLICT ("slug") 
DO UPDATE SET "xp_reward" = EXCLUDED."xp_reward";
