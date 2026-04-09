import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add, FolderOpen } from '@mui/icons-material';
import styled from '@emotion/styled';

const Root = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 32px;
  text-align: center;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
`;

const IconWrap = styled(Box)`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: #64748b;
`;

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon = FolderOpen }) {
  return (
    <Root>
      <IconWrap>
        <Icon sx={{ fontSize: 32 }} />
      </IconWrap>
      <Typography variant="subtitle1" sx={{ color: '#0f172a', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 2, maxWidth: 400, lineHeight: 1.6 }}>
        {description}
      </Typography>
      {onAction && (
        <Button variant="contained" startIcon={<Add />} onClick={onAction} sx={{ borderRadius: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Root>
  );
}
