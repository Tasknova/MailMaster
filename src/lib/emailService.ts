import { supabase } from '@/integrations/supabase/client';

export interface EmailSendResult {
  success: boolean;
  message: string;
  sentCount?: number;
  failedCount?: number;
}

export const sendCampaignEmails = async (campaignId: string): Promise<EmailSendResult> => {
  try {
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Get contacts for the campaign
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('list_id', campaign.list_id)
      .eq('status', 'active');

    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: 'No active contacts found in the selected list'
      };
    }

    // Update campaign status to sending
    await supabase
      .from('campaigns')
      .update({ 
        status: 'sending',
        total_recipients: contacts.length,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    // Create campaign send records
    const sendRecords = contacts.map(contact => ({
      campaign_id: campaignId,
      contact_id: contact.id,
      email: contact.email,
      status: 'pending'
    }));

    const { error: sendRecordsError } = await supabase
      .from('campaign_sends')
      .insert(sendRecords);

    if (sendRecordsError) throw sendRecordsError;

    // Simulate email sending with delays
    let sentCount = 0;
    let failedCount = 0;

    for (const contact of contacts) {
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate success/failure (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        sentCount++;
        
        // Update campaign send record
        await supabase
          .from('campaign_sends')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('campaign_id', campaignId)
          .eq('contact_id', contact.id);

        // Simulate opens and clicks after some time
        setTimeout(async () => {
          const willOpen = Math.random() > 0.3; // 70% open rate
          if (willOpen) {
            await supabase
              .from('campaign_sends')
              .update({ 
                opened_at: new Date().toISOString()
              })
              .eq('campaign_id', campaignId)
              .eq('contact_id', contact.id);

                         // Update campaign open count
             await supabase
               .from('campaigns')
               .update({ total_opened: campaign.total_opened + 1 })
               .eq('id', campaignId);

            // Simulate clicks (30% of opens)
            setTimeout(async () => {
              const willClick = Math.random() > 0.7;
              if (willClick) {
                await supabase
                  .from('campaign_sends')
                  .update({ 
                    clicked_at: new Date().toISOString()
                  })
                  .eq('campaign_id', campaignId)
                  .eq('contact_id', contact.id);

                                 // Update campaign click count
                 await supabase
                   .from('campaigns')
                   .update({ total_clicked: campaign.total_clicked + 1 })
                   .eq('id', campaignId);
              }
            }, Math.random() * 30000 + 10000); // 10-40 seconds after open
          }
        }, Math.random() * 60000 + 30000); // 30-90 seconds after send
      } else {
        failedCount++;
        
        // Update campaign send record
        await supabase
          .from('campaign_sends')
          .update({ 
            status: 'failed',
            error_message: 'Simulated delivery failure'
          })
          .eq('campaign_id', campaignId)
          .eq('contact_id', contact.id);
      }
    }

    // Update campaign final status
    await supabase
      .from('campaigns')
      .update({ 
        status: 'sent',
        total_sent: sentCount,
        total_delivered: sentCount,
        total_bounced: failedCount
      })
      .eq('id', campaignId);

    return {
      success: true,
      message: `Campaign sent successfully! ${sentCount} emails sent, ${failedCount} failed.`,
      sentCount,
      failedCount
    };

  } catch (error) {
    console.error('Error sending campaign:', error);
    
    // Update campaign status to failed
    await supabase
      .from('campaigns')
      .update({ status: 'failed' })
      .eq('id', campaignId);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send campaign'
    };
  }
};

export const getCampaignStats = async (campaignId: string) => {
  try {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) throw error;

    // Get campaign send statistics
    const { data: sends, error: sendsError } = await supabase
      .from('campaign_sends')
      .select('status, opened_at, clicked_at')
      .eq('campaign_id', campaignId);

    if (sendsError) throw sendsError;

    const stats = {
      total: sends?.length || 0,
      sent: sends?.filter(s => s.status === 'sent').length || 0,
      failed: sends?.filter(s => s.status === 'failed').length || 0,
      opened: sends?.filter(s => s.opened_at).length || 0,
      clicked: sends?.filter(s => s.clicked_at).length || 0,
    };

    return {
      ...campaign,
      stats
    };
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    throw error;
  }
}; 