import React from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';
import styled from '@emotion/styled';
import { EditableCell } from './EditableCell';

const EMPTY_COLOR = '#4a5568';

const TableWrap = styled(Box)`
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 0;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const Th = styled.th`
  text-align: left;
  padding: 8px 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
  border-bottom: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.28);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 6px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  vertical-align: middle;
`;

const COL_WIDTHS = { no: 56, partCode: 180, description: 280, material: 120, jenisHardware: 140, qty: 80, keterangan: 140, action: 48 };

export function HardwareTable({ hardwareRows, updateHardwareRow, addHardwareRow, removeHardwareRow }) {
  const emptyColor = EMPTY_COLOR;

  return (
    <TableWrap>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Data Hardware / Miscellaneous</Typography>
        {addHardwareRow && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={addHardwareRow}
            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' } }}
          >
            Tambah baris
          </Button>
        )}
      </Box>
      <Table>
        <thead>
          <tr>
            <Th style={{ width: COL_WIDTHS.no, textAlign: 'center' }}>No</Th>
            <Th style={{ width: COL_WIDTHS.partCode }}>Kode Part</Th>
            <Th style={{ width: COL_WIDTHS.description }}>Deskripsi</Th>
            <Th style={{ width: COL_WIDTHS.material }}>Material</Th>
            <Th style={{ width: COL_WIDTHS.jenisHardware }}>Jenis Hardware</Th>
            <Th style={{ width: COL_WIDTHS.qty, textAlign: 'center' }}>Qty</Th>
            <Th style={{ width: COL_WIDTHS.keterangan }}>Keterangan</Th>
            {removeHardwareRow && <Th style={{ width: COL_WIDTHS.action }} />}
          </tr>
        </thead>
        <tbody>
          {(!hardwareRows || hardwareRows.length === 0) ? (
            <tr>
              <td colSpan={removeHardwareRow ? 8 : 7} style={{ padding: 24, textAlign: 'center', color: EMPTY_COLOR }}>
                Belum ada data hardware. Klik &quot;Tambah baris&quot; untuk menambah.
              </td>
            </tr>
          ) : (
            hardwareRows.map((row) => (
              <tr key={row.id}>
                <Td style={{ width: COL_WIDTHS.no, textAlign: 'center' }}>{row.no ?? <span style={{ color: emptyColor }}>—</span>}</Td>
                <Td style={{ width: COL_WIDTHS.partCode }}>
                  <EditableCell value={row.partCode} field="partCode" rowId={row.id} onUpdate={updateHardwareRow} emptyColor={emptyColor} min={0} />
                </Td>
                <Td style={{ width: COL_WIDTHS.description }}>
                  <EditableCell value={row.description} field="description" rowId={row.id} onUpdate={updateHardwareRow} emptyColor={emptyColor} />
                </Td>
                <Td style={{ width: COL_WIDTHS.material }}>
                  <EditableCell value={row.material} field="material" rowId={row.id} onUpdate={updateHardwareRow} emptyColor={emptyColor} />
                </Td>
                <Td style={{ width: COL_WIDTHS.jenisHardware }}>
                  <EditableCell value={row.jenisHardware} field="jenisHardware" rowId={row.id} onUpdate={updateHardwareRow} emptyColor={emptyColor} />
                </Td>
                <Td style={{ width: COL_WIDTHS.qty }}>
                  <EditableCell value={row.qty} field="qty" rowId={row.id} onUpdate={updateHardwareRow} type="number" align="right" emptyColor={emptyColor} min={0} />
                </Td>
                <Td style={{ width: COL_WIDTHS.keterangan }}>
                  <EditableCell value={row.keterangan} field="keterangan" rowId={row.id} onUpdate={updateHardwareRow} emptyColor={emptyColor} />
                </Td>
                {removeHardwareRow && (
                  <Td style={{ width: COL_WIDTHS.action, textAlign: 'center' }}>
                    <IconButton size="small" onClick={() => removeHardwareRow(row.id)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#f87171', bgcolor: 'rgba(248,113,113,0.1)' } }}>
                      <DeleteOutline sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </TableWrap>
  );
}
