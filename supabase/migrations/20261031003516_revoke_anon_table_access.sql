/*
# Remove anonymous access to Flaunt tables

1. Modified Tables
- profiles, campaigns, campaign_phases, calendar_items, campaign_assets, generations, campaign_summary: anonymous (signed-out) visitors lose all table permissions.

2. Security
- Flaunt requires sign-in, so the anonymous role never needs access. Policies already blocked it; this removes the permissions too.
- Signed-in access is unchanged.
*/
revoke all on public.profiles, public.campaigns, public.campaign_phases, public.calendar_items,
  public.campaign_assets, public.generations, public.campaign_summary from anon;
