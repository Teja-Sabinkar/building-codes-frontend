// src/app/api/feedback/route.js - Fixed Image Attachment Handling
import { NextResponse } from 'next/server';
import { sendEmail } from '@/services/email-service';

export async function POST(request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    
    // Extract form fields
    const title = formData.get('title');
    const description = formData.get('description');
    const allowContact = formData.get('allowContact') === 'true';

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ 
        message: 'Title and description are required',
        success: false 
      }, { status: 400 });
    }

    // Process uploaded files with proper encoding
    const attachments = [];
    const files = [];
    
    // Get all file entries
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }
    
    // Process each file with proper MIME type detection
    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Get proper MIME type for images
        let contentType = file.type;
        if (!contentType && file.name) {
          const ext = file.name.toLowerCase().split('.').pop();
          const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          };
          contentType = mimeTypes[ext] || 'application/octet-stream';
        }
        
        attachments.push({
          filename: file.name,
          content: buffer,
          contentType: contentType,
          encoding: 'base64',  // Explicitly set encoding for images
          cid: `attachment_${attachments.length}` // Content ID for inline images
        });
        
        console.log(`✅ Processed file: ${file.name} (${contentType}, ${buffer.length} bytes)`);
      } catch (error) {
        console.error('❌ Error processing file:', file.name, error);
      }
    }

    // Prepare email content with inline image support
    const emailSubject = `REG-GPT Feedback: ${title}`;
    
    // Build inline image references for email
    const inlineImageHTML = attachments
      .filter(att => att.contentType.startsWith('image/'))
      .map((att, index) => `
        <div style="margin: 10px 0;">
          <p style="margin: 5px 0; font-weight: bold; color: #374151;">Attached Image: ${att.filename}</p>
          <img src="cid:${att.cid}" style="max-width: 500px; height: auto; border: 1px solid #e5e7eb; border-radius: 4px;" alt="${att.filename}">
        </div>
      `).join('');
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0 0 8px 0;">REG-GPT Feedback Submission</h2>
          <p style="color: #047857; margin: 0; font-size: 14px;">Building Codes Assistant Feedback</p>
        </div>
        
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <h3 style="color: #111827; margin-top: 0;">Feedback Details</h3>
          
          <div style="margin-bottom: 16px;">
            <strong style="color: #374151;">Title:</strong>
            <p style="margin: 4px 0 0 0; color: #1f2937;">${title}</p>
          </div>
          
          <div style="margin-bottom: 16px;">
            <strong style="color: #374151;">Description:</strong>
            <div style="margin: 4px 0 0 0; color: #1f2937; white-space: pre-wrap;">${description}</div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <strong style="color: #374151;">Contact Permission:</strong>
            <p style="margin: 4px 0 0 0; color: #1f2937;">
              ${allowContact ? '✅ User agrees to be contacted for follow-up' : '❌ User does not want to be contacted'}
            </p>
          </div>
          
          ${attachments.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <strong style="color: #374151;">Attachments (${attachments.length} files):</strong>
            <ul style="margin: 4px 0 0 20px; color: #1f2937;">
              ${attachments.map(att => `
                <li>${att.filename} (${att.contentType || 'unknown'}, ${(att.content.length / 1024).toFixed(1)} KB)</li>
              `).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${inlineImageHTML ? `
          <div style="margin-bottom: 16px;">
            <strong style="color: #374151;">Attached Images:</strong>
            ${inlineImageHTML}
          </div>
          ` : ''}
          
          <div style="background-color: #f9fafb; border-radius: 6px; padding: 12px; margin-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              <strong>Submission Time:</strong> ${new Date().toLocaleString('en-GB', { 
                timeZone: 'Europe/London',
                dateStyle: 'full',
                timeStyle: 'medium'
              })}
            </p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 16px; background-color: #f8fafc; border-radius: 8px;">
          <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
            This feedback was submitted through the REG-GPT Building Codes Assistant feedback form.
          </p>
        </div>
      </div>
    `;

    // Send email with proper attachment configuration
    const emailOptions = {
      to: 'teja.sabinkar2304@gmail.com',
      subject: emailSubject,
      html: emailHtml
    };

    // Add attachments if any exist
    if (attachments.length > 0) {
      emailOptions.attachments = attachments;
    }

    await sendEmail(emailOptions);

    // Log successful submission with attachment details
    console.log('✅ Feedback submitted successfully:', {
      title,
      allowContact,
      attachmentCount: attachments.length,
      attachmentTypes: attachments.map(att => ({ name: att.filename, type: att.contentType })),
      timestamp: new Date().toISOString(),
    });

    // Return success response
    return NextResponse.json({ 
      message: 'Feedback submitted successfully',
      success: true,
      attachmentCount: attachments.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error processing feedback submission:', error);
    
    return NextResponse.json({ 
      message: 'Internal server error. Please try again later.',
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ 
    message: 'Feedback API - Use POST method to submit feedback' 
  }, { status: 405 });
}