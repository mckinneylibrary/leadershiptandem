CREATE OR REPLACE FUNCTION public.create_workspace(_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare ws uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into workspaces(name, created_by) values (_name, auth.uid()) returning id into ws;
  insert into workspace_members(workspace_id, user_id, role) values (ws, auth.uid(), 'owner');
  insert into templates(workspace_id, name, description, leader_prompts, report_prompts, published) values
  (ws,'Weekly check-in','A light, regular pulse on work and momentum.',
    '["What went well since we last talked?","Where can I remove a blocker for you?","What feedback do I owe you?","What should we prioritize next week?","What do you need from me this week?"]',
    '["What were your wins this week?","What''s blocking you?","What are your top priorities for next week?","What support do you need from me?","Anything personal I should know about?"]', true),
  (ws,'Coaching check-in','Skill growth and feedback, every couple of weeks.',
    '["How is progress on your current goals?","What one skill should we grow next?","What feedback do I owe you?","What have I noticed that is worth sharing?","What are our commitments before next time?"]',
    '["How is progress on your current goals?","What is one skill you want to grow?","What feedback do you have for me?","What could I do differently to support you?","What are our commitments before next time?"]', true),
  (ws,'Career growth','Longer-horizon conversation about direction and skills.',
    '["Where do you want to be in 1-2 years?","Which strength should you lean into more?","Which growth area should we develop next?","What learning or training should we invest in?","What stretch opportunity could I open up?"]',
    '["Where do you want to be in 1-2 years?","What strengths do you want to lean into?","What growth areas do you want to develop?","What learning or training would you like to pursue?","What stretch opportunities would you like to explore?"]', true),
  (ws,'Quarterly goals review','Recalibrate goals and commitments each quarter.',
    '["What progress have you made on each goal this quarter?","Which goals should we keep, drop, or change?","What goals make sense for next quarter?","What resources or support do you need?","How can the team help you succeed?"]',
    '["What progress have you made on each goal this quarter?","Which goals should we keep, drop, or change?","What goals should we set for next quarter?","What resources or support do you need?","How can the team help you succeed?"]', true),
  (ws,'First 90 days','For someone new to the team or role.',
    '["What early wins have you seen?","Is the role matching expectations so far?","How are their key relationships forming?","Where are they still ramping?","What goals should we set for the next 30 days?"]',
    '["How are your first weeks going so far?","Is the role what you expected?","How are key relationships forming?","What is clicking, and where are you still ramping?","What do you need to feel set up for success?"]', true),
  (ws,'Skip-level','A leader meeting with their report''s reports.',
    '["How is their team functioning?","How is their manager supporting them?","What concerns or ideas reach beyond their team?","What development are they thinking about?","What should leadership know?"]',
    '["How is your team functioning?","How is your manager supporting you?","What concerns or ideas reach beyond your team?","Where do you want to develop?","Anything you''d want leadership to know?"]', true),
  (ws,'Project debrief','After a major project or milestone.',
    '["What went well on the project?","What didn''t go well?","What lessons should we carry forward?","What would they do differently next time?","What are the next steps and follow-ups?"]',
    '["What went well?","What didn''t go well?","What are the key lessons learned?","What would you do differently?","What are the next steps and follow-ups?"]', true),
  (ws,'Back from time away','Reconnecting after an extended break.',
    '["How are they feeling about being back?","How should we calibrate workload for the first few weeks?","What catch-up do they need on projects, people, and decisions?","What flexibility or adjustments are needed?","What else would support their transition?"]',
    '["How are you feeling about being back?","How should we calibrate your workload for the first few weeks?","What catch-up do you need on projects, people, and decisions?","What flexibility or adjustments do you need?","Anything else that would support your transition?"]', true),
  (ws,'Getting back on track','A supportive reset when expectations drift.',
    '["Which expectations are not being met?","What examples and impact have you seen?","What is the root cause?","What support plan and resources should we put in place?","What follow-up cadence and success criteria should we agree on?"]',
    '["Which expectations feel unclear or unmet?","What examples and impact would you point to?","What do you see as the root cause?","What support or resources would help?","What cadence and success criteria should we agree on?"]', true);
  return ws;
end $function$