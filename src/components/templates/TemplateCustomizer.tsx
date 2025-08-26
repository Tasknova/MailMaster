import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Undo2, Redo2, RotateCcw, Eye, Grid3X3, Ruler, Save, Palette, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import './TemplateCustomizer.css';

interface Template {
  id: string;
  name: string;
  description: string;
  html_content: string;
  is_default: boolean;
  created_at: string;
}

interface TemplateCustomizerProps {
  template: Template;
  onBack: () => void;
  onSave: (template: Template) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface EditableElement {
  id: string;
  label: string;
  type: 'text' | 'color' | 'link' | 'image';
  value: string;
  description?: string;
}

const TemplateCustomizer = ({ template, onBack, onSave, isOpen, onClose }: TemplateCustomizerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editableElements, setEditableElements] = useState<EditableElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [branding, setBranding] = useState({
    company_name: 'My Company',
    company_email: 'hello@mycompany.com',
    company_phone: '+1 (555) 123-4567',
    company_address: '123 Business St, City, State 12345'
  });
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [debugMode, setDebugMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (template) {
      fetchBrandingSettings();
      generatePreview(template.html_content);
      extractEditableElements(template.html_content);
    }
  }, [template]);

  useEffect(() => {
    if (isEditing && previewRef.current) {
      const addClickListeners = () => {
        const previewElement = previewRef.current;
        if (!previewElement) return;
        
        console.log('Setting up event listeners...');
        const allElements = previewElement.querySelectorAll('*');
        allElements.forEach(element => {
          element.removeEventListener('click', handlePreviewElementClick);
        });
        allElements.forEach(element => {
          element.addEventListener('click', handlePreviewElementClick);
        });
        previewElement.addEventListener('click', handlePreviewElementClick);
        console.log(`Added event listeners to ${allElements.length} elements`);
      };

      const tryAddListeners = () => {
        if (previewRef.current && previewRef.current.children.length > 0) {
          addClickListeners();
        } else {
          console.log('Preview not ready, retrying...');
          setTimeout(tryAddListeners, 100);
        }
      };
      tryAddListeners();
    }

    return () => {
      if (previewRef.current) {
        const allElements = previewRef.current.querySelectorAll('*');
        allElements.forEach(element => {
          element.removeEventListener('click', handlePreviewElementClick);
        });
        previewRef.current.removeEventListener('click', handlePreviewElementClick);
      }
    };
  }, [isEditing, previewHtml]);

  const fetchBrandingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .single();
      
      if (data && !error) {
        setBranding(data);
      }
    } catch (error) {
      console.log('No branding settings found, using defaults');
    }
  };

  const generatePreview = (htmlContent: string) => {
    let preview = htmlContent;
    
    // Replace template variables with branding data
    preview = preview.replace(/\{\{company_name\}\}/g, branding.company_name);
    preview = preview.replace(/\{\{company_email\}\}/g, branding.company_email);
    preview = preview.replace(/\{\{company_phone\}\}/g, branding.company_phone);
    preview = preview.replace(/\{\{company_address\}\}/g, branding.company_address);
    preview = preview.replace(/\{\{first_name\}\}/g, 'John');
    preview = preview.replace(/\{\{subject\}\}/g, 'Sample Email Subject');
    preview = preview.replace(/\{\{unsubscribe_url\}\}/g, '#');
    preview = preview.replace(/\{\{preferences_url\}\}/g, '#');
    
    setPreviewHtml(preview);
    console.log('Preview HTML updated:', preview.substring(0, 200) + '...');
  };

  const extractEditableElements = (htmlContent: string) => {
    const elements: EditableElement[] = [
      // Company branding
      { id: 'company_name', label: 'Company Name', type: 'text', value: branding.company_name },
      { id: 'company_email', label: 'Company Email', type: 'text', value: branding.company_email },
      { id: 'company_phone', label: 'Company Phone', type: 'text', value: branding.company_phone },
      { id: 'company_address', label: 'Company Address', type: 'text', value: branding.company_address },
      
      // Text content
      { id: 'greeting_text', label: 'Greeting Text', type: 'text', value: 'Welcome, John! 👋' },
      { id: 'intro_text', label: 'Introduction Text', type: 'text', value: 'Thank you for choosing My Company. We\'re thrilled to have you join our community.' },
      { id: 'cta_text', label: 'CTA Button Text', type: 'text', value: 'Get Started Now' },
      { id: 'footer_text', label: 'Footer Text', type: 'text', value: 'Best regards, The My Company Team' },
      
      // Colors
      { id: 'header_color', label: 'Header Background', type: 'color', value: '#667eea' },
      { id: 'background_color', label: 'Background Color', type: 'color', value: '#f8f9fa' },
      { id: 'text_color', label: 'Text Color', type: 'color', value: '#333333' },
      { id: 'button_color', label: 'Button Color', type: 'color', value: '#667eea' },
      
      // Additional editable elements
      { id: 'tagline_text', label: 'Tagline', type: 'text', value: 'Welcome to the Future' },
      { id: 'features_title', label: 'Features Title', type: 'text', value: 'What You Can Expect:' },
      { id: 'feature_1', label: 'Feature 1', type: 'text', value: 'Exclusive insights and industry updates' },
      { id: 'feature_2', label: 'Feature 2', type: 'text', value: 'Premium content and resources' },
      { id: 'feature_3', label: 'Feature 3', type: 'text', value: 'Early access to new features' },
      { id: 'feature_4', label: 'Feature 4', type: 'text', value: 'Personalized recommendations' },
      { id: 'support_text', label: 'Support Text', type: 'text', value: 'We\'re committed to providing you with the best experience possible.' },
      { id: 'logo_text', label: 'Logo Text', type: 'text', value: branding.company_name },
      { id: 'issue_info', label: 'Issue Info', type: 'text', value: 'Monthly Newsletter • Sample Subject' },
      { id: 'section_title_1', label: 'Section Title 1', type: 'text', value: 'This Month\'s Highlights' },
      { id: 'section_title_2', label: 'Section Title 2', type: 'text', value: 'Featured Story' },
      { id: 'section_title_3', label: 'Section Title 3', type: 'text', value: 'Pro Tips' },
      { id: 'section_title_4', label: 'Section Title 4', type: 'text', value: 'Upcoming Events' },
      { id: 'highlight_title', label: 'Highlight Title', type: 'text', value: 'Breaking News: Major Platform Update' },
      { id: 'highlight_text', label: 'Highlight Text', type: 'text', value: 'We\'ve completely redesigned our platform to provide you with an even better experience.' },
      { id: 'tip_1', label: 'Tip 1', type: 'text', value: 'Optimize your workflow with our new automation features' },
      { id: 'tip_2', label: 'Tip 2', type: 'text', value: 'Join our upcoming webinar on "Advanced Strategies"' },
      { id: 'tip_3', label: 'Tip 3', type: 'text', value: 'Connect with other members in our community forum' },
      { id: 'tip_4', label: 'Tip 4', type: 'text', value: 'Download our latest resource guide for free' },
      { id: 'events_text', label: 'Events Text', type: 'text', value: 'Don\'t miss these exciting opportunities to learn and grow with our community:' },
      { id: 'event_1', label: 'Event 1', type: 'text', value: '📅 Webinar: "Future of Digital Marketing" - Next Tuesday' },
      { id: 'event_2', label: 'Event 2', type: 'text', value: '🎪 Conference: Annual Tech Summit - March 15-17' },
      { id: 'event_3', label: 'Event 3', type: 'text', value: '🏆 Contest: Innovation Challenge - Submit by March 30' },
      { id: 'thank_you_text', label: 'Thank You Text', type: 'text', value: 'Thank you for being part of our amazing community!' }
    ];
    
    setEditableElements(elements);
  };

  const handlePreviewElementClick = (event: Event) => {
    console.log('Click handler called!', { isEditing, target: event.target });
    if (!isEditing) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    const elementType = target.tagName.toLowerCase();
    const elementText = target.textContent?.trim() || '';
    const elementStyle = target.style;
    const elementClasses = target.className;
    
    console.log('Clicked element details:', {
      tagName: elementType,
      text: elementText,
      classes: elementClasses,
      id: target.id,
      innerHTML: target.innerHTML.substring(0, 100)
    });

    // Match clicked element to editable elements
    let matchingElement: EditableElement | undefined;

    // Match by text content first
    matchingElement = editableElements.find(el => 
      el.value.toLowerCase() === elementText.toLowerCase() ||
      elementText.toLowerCase().includes(el.value.toLowerCase())
    );

    // Match by specific selectors
    if (!matchingElement) {
      if (target.classList.contains('logo')) {
        matchingElement = editableElements.find(el => el.id === 'logo_text');
      } else if (target.classList.contains('tagline')) {
        matchingElement = editableElements.find(el => el.id === 'tagline_text');
      } else if (target.classList.contains('greeting')) {
        matchingElement = editableElements.find(el => el.id === 'greeting_text');
      } else if (target.classList.contains('main-text') || target.classList.contains('intro-text')) {
        matchingElement = editableElements.find(el => el.id === 'intro_text');
      } else if (target.classList.contains('cta-button')) {
        matchingElement = editableElements.find(el => el.id === 'cta_text');
      } else if (target.classList.contains('issue-info')) {
        matchingElement = editableElements.find(el => el.id === 'issue_info');
      } else if (target.classList.contains('section-title')) {
        matchingElement = editableElements.find(el => el.id === 'section_title_1');
      } else if (target.classList.contains('highlight-box')) {
        matchingElement = editableElements.find(el => el.id === 'highlight_title');
      } else if (target.classList.contains('tips-list')) {
        matchingElement = editableElements.find(el => el.id === 'tip_1');
      }
    }

    if (matchingElement) {
      if (debugMode) console.log('Matched element:', matchingElement.label);
      handleElementClick(matchingElement);
    } else {
      console.log('No matching element found for:', {
        text: elementText,
        tagName: elementType,
        classes: elementClasses,
        availableElements: editableElements.map(el => el.id)
      });
    }
  };

  const handleElementClick = (element: EditableElement) => {
    if (!isEditing) return;
    
    if (debugMode) console.log('Element clicked:', element.label);
    setSelectedElement(element);
    
    const previewElement = previewRef.current;
    if (previewElement) {
      // Clear previous highlights
      const allElements = previewElement.querySelectorAll('*');
      allElements.forEach(el => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.outlineOffset = '';
        (el as HTMLElement).classList.remove('selected-element');
      });

      // Highlight matching elements
      let elements: NodeListOf<Element> | null = null;
      
      if (element.id === 'logo_text') {
        elements = previewElement.querySelectorAll('.logo');
      } else if (element.id === 'tagline_text') {
        elements = previewElement.querySelectorAll('.tagline');
      } else if (element.id === 'greeting_text') {
        elements = previewElement.querySelectorAll('.greeting');
      } else if (element.id === 'intro_text') {
        elements = previewElement.querySelectorAll('.main-text, .intro-text');
      } else if (element.id === 'cta_text') {
        elements = previewElement.querySelectorAll('.cta-button');
      } else if (element.id === 'issue_info') {
        elements = previewElement.querySelectorAll('.issue-info');
      } else if (element.id === 'section_title_1') {
        elements = previewElement.querySelectorAll('.section-title');
      } else if (element.id === 'highlight_title') {
        elements = previewElement.querySelectorAll('.highlight-box h4');
      } else if (element.id === 'tip_1') {
        elements = previewElement.querySelectorAll('.tips-list li');
      } else {
        // Try to find by text content
        elements = previewElement.querySelectorAll('*');
        const matchingElements = Array.from(elements).filter(el => 
          el.textContent?.trim() === element.value ||
          el.textContent?.trim().includes(element.value)
        );
        elements = matchingElements.length > 0 ? 
          matchingElements as unknown as NodeListOf<Element> : null;
      }

      if (elements && elements.length > 0) {
        elements.forEach(el => {
          (el as HTMLElement).style.outline = '3px solid #10b981';
          (el as HTMLElement).style.outlineOffset = '2px';
          (el as HTMLElement).classList.add('selected-element');
        });
        if (debugMode) console.log(`Highlighted ${elements.length} elements for ${element.label}`);
      }
    }
  };

  const handleElementUpdate = (elementId: string, newValue: string) => {
    if (debugMode) console.log('Updating element:', elementId, 'with value:', newValue);
    
    setEditableElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, value: newValue } : el
    ));

    // Update branding state if it's a branding element
    if (['company_name', 'company_email', 'company_phone', 'company_address'].includes(elementId)) {
      setBranding(prev => ({ ...prev, [elementId]: newValue }));
    }

    // Update the preview
    const previewElement = previewRef.current;
    if (!previewElement) return;

    // Update specific elements based on elementId
    if (elementId === 'logo_text') {
      const elements = previewElement.querySelectorAll('.logo');
      elements.forEach(el => {
        el.textContent = newValue;
      });
    } else if (elementId === 'tagline_text') {
      const elements = previewElement.querySelectorAll('.tagline');
      elements.forEach(el => {
        el.textContent = newValue;
      });
    } else if (elementId === 'greeting_text') {
      const elements = previewElement.querySelectorAll('.greeting');
      elements.forEach(el => {
        el.textContent = newValue;
      });
    } else if (elementId === 'intro_text') {
      const elements = previewElement.querySelectorAll('.main-text, .intro-text');
      elements.forEach(el => {
        el.textContent = newValue;
      });
    } else if (elementId === 'cta_text') {
      const elements = previewElement.querySelectorAll('.cta-button');
      elements.forEach(el => {
        el.textContent = newValue;
      });
    } else if (elementId === 'header_color') {
      const elements = previewElement.querySelectorAll('.header');
      elements.forEach(el => {
        (el as HTMLElement).style.background = newValue;
      });
    } else if (elementId === 'background_color') {
      const elements = previewElement.querySelectorAll('body');
      elements.forEach(el => {
        (el as HTMLElement).style.backgroundColor = newValue;
      });
    } else if (elementId === 'text_color') {
      const elements = previewElement.querySelectorAll('body');
      elements.forEach(el => {
        (el as HTMLElement).style.color = newValue;
      });
    } else if (elementId === 'button_color') {
      const elements = previewElement.querySelectorAll('.cta-button');
      elements.forEach(el => {
        (el as HTMLElement).style.background = newValue;
      });
    } else {
      // Try to find and update by text content
      const allElements = previewElement.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.textContent?.trim() === selectedElement?.value) {
          el.textContent = newValue;
        }
      });
    }

    // Add to history
    if (editHistory.length === 0) {
      addToHistory(template.html_content);
    }
    addToHistory(previewElement.innerHTML);
  };

  const addToHistory = (html: string) => {
    setEditHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), html];
      if (newHistory.length > 20) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (previewRef.current) {
        previewRef.current.innerHTML = editHistory[newIndex];
      }
    }
  };

  const redo = () => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (previewRef.current) {
        previewRef.current.innerHTML = editHistory[newIndex];
      }
    }
  };

  const resetToOriginal = () => {
    generatePreview(template.html_content);
    setEditHistory([]);
    setHistoryIndex(-1);
  };

  const clearSelection = () => {
    setSelectedElement(null);
    if (previewRef.current) {
      const allElements = previewRef.current.querySelectorAll('*');
      allElements.forEach(el => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.outlineOffset = '';
        (el as HTMLElement).classList.remove('selected-element');
      });
    }
  };

  const handleSave = () => {
    if (previewRef.current) {
      const updatedTemplate = {
        ...template,
        html_content: previewRef.current.innerHTML
      };
      onSave(updatedTemplate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-lg w-full h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Customize Template: {template.name}</h2>
              <p className="text-sm text-muted-foreground">Click any element to edit it</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Preview Mode" : "Edit Mode"}
            </Button>
            
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= editHistory.length - 1}>
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={resetToOriginal}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </>
            )}
            
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Controls */}
          {isEditing && (
            <div className="w-80 border-r overflow-y-auto p-4 space-y-4">
              {/* View Controls */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Zoom: {zoomLevel}%</Label>
                    <Slider
                      value={[zoomLevel]}
                      onValueChange={([value]) => setZoomLevel(value)}
                      max={200}
                      min={50}
                      step={10}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Grid</Label>
                    <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Rulers</Label>
                    <Switch checked={showRulers} onCheckedChange={setShowRulers} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Auto Save</Label>
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Debug Mode</Label>
                    <Switch checked={debugMode} onCheckedChange={setDebugMode} />
                  </div>
                </CardContent>
              </Card>

              {/* Text Formatting */}
              {selectedElement && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Text Formatting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Bold className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Italic className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Underline className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <AlignLeft className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <AlignCenter className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <AlignRight className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Font Size</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="16px" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12px</SelectItem>
                          <SelectItem value="14">14px</SelectItem>
                          <SelectItem value="16">16px</SelectItem>
                          <SelectItem value="18">18px</SelectItem>
                          <SelectItem value="20">20px</SelectItem>
                          <SelectItem value="24">24px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Font Family</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Segoe UI" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arial">Arial</SelectItem>
                          <SelectItem value="helvetica">Helvetica</SelectItem>
                          <SelectItem value="times">Times New Roman</SelectItem>
                          <SelectItem value="georgia">Georgia</SelectItem>
                          <SelectItem value="segoe">Segoe UI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Editable Elements */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Editable Elements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editableElements.map((element) => (
                    <div key={element.id} className="space-y-2">
                      <Label className="text-xs flex items-center justify-between">
                        {element.label}
                        {selectedElement?.id === element.id && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </Label>
                      
                      {element.type === 'text' && (
                        <Input
                          value={element.value}
                          onChange={(e) => handleElementUpdate(element.id, e.target.value)}
                          className="text-xs"
                          placeholder={element.label}
                        />
                      )}
                      
                      {element.type === 'color' && (
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={element.value}
                            onChange={(e) => handleElementUpdate(element.id, e.target.value)}
                            className="w-12 h-8 p-1"
                          />
                          <Input
                            value={element.value}
                            onChange={(e) => handleElementUpdate(element.id, e.target.value)}
                            className="text-xs flex-1"
                            placeholder="#000000"
                          />
                        </div>
                      )}
                      
                      {element.description && (
                        <p className="text-xs text-muted-foreground">{element.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 m-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="border rounded-lg overflow-hidden relative h-full">
                  <div 
                    ref={previewRef}
                    className={`w-full h-full overflow-auto bg-white template-preview ${isEditing ? 'edit-mode cursor-pointer' : ''}`}
                    style={{ 
                      transform: `scale(${zoomLevel / 100})`, 
                      transformOrigin: 'top left',
                      minHeight: `${100 * (zoomLevel / 100)}vh`,
                      maxHeight: 'none'
                    }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                  
                  {showGrid && (
                    <div className="grid-overlay" style={{ backgroundSize: '20px 20px' }} />
                  )}
                  
                  {showRulers && (
                    <>
                      <div className="ruler ruler-top" />
                      <div className="ruler ruler-left" />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Instructions */}
        {isEditing && (
          <div className="p-4 border-t bg-muted/50">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How to Edit:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• <strong>Click any element</strong> in the preview to select it</li>
                <li>• <strong>Use the left panel</strong> to edit text, colors, and formatting</li>
                <li>• <strong>Text elements:</strong> Company name, email, phone, address, greeting, CTA</li>
                <li>• <strong>Color elements:</strong> Header, background, text, and button colors</li>
                <li>• <strong>Use Undo/Redo</strong> to revert changes</li>
                {debugMode && <li>• <strong>Debug Mode:</strong> Check browser console for detailed logs</li>}
              </ul>
            </div>
            
            {selectedElement && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <strong>Selected:</strong> {selectedElement.label} ({selectedElement.type})
              </div>
            )}
            
            {debugMode && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>Debug Mode Active:</strong> Check browser console for detailed logs
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateCustomizer; 