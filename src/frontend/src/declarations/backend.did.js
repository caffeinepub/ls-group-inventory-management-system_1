/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const idlService = IDL.Service({
  'getAllData' : IDL.Func(
      [],
      [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text],
      ['query'],
    ),
  'getInventory' : IDL.Func([], [IDL.Text], ['query']),
  'setInventory' : IDL.Func([IDL.Text], [], []),
  'getBardana' : IDL.Func([], [IDL.Text], ['query']),
  'setBardana' : IDL.Func([IDL.Text], [], []),
  'getOrders' : IDL.Func([], [IDL.Text], ['query']),
  'setOrders' : IDL.Func([IDL.Text], [], []),
  'getTools' : IDL.Func([], [IDL.Text], ['query']),
  'setTools' : IDL.Func([IDL.Text], [], []),
  'getRawMaterials' : IDL.Func([], [IDL.Text], ['query']),
  'setRawMaterials' : IDL.Func([IDL.Text], [], []),
  'getChangeLogInventory' : IDL.Func([], [IDL.Text], ['query']),
  'setChangeLogInventory' : IDL.Func([IDL.Text], [], []),
  'getChangeLogBardana' : IDL.Func([], [IDL.Text], ['query']),
  'setChangeLogBardana' : IDL.Func([IDL.Text], [], []),
  'getTransactionLog' : IDL.Func([], [IDL.Text], ['query']),
  'setTransactionLog' : IDL.Func([IDL.Text], [], []),
  'getUsers' : IDL.Func([], [IDL.Text], ['query']),
  'setUsers' : IDL.Func([IDL.Text], [], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getAllData' : IDL.Func(
        [],
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        ['query'],
      ),
    'getInventory' : IDL.Func([], [IDL.Text], ['query']),
    'setInventory' : IDL.Func([IDL.Text], [], []),
    'getBardana' : IDL.Func([], [IDL.Text], ['query']),
    'setBardana' : IDL.Func([IDL.Text], [], []),
    'getOrders' : IDL.Func([], [IDL.Text], ['query']),
    'setOrders' : IDL.Func([IDL.Text], [], []),
    'getTools' : IDL.Func([], [IDL.Text], ['query']),
    'setTools' : IDL.Func([IDL.Text], [], []),
    'getRawMaterials' : IDL.Func([], [IDL.Text], ['query']),
    'setRawMaterials' : IDL.Func([IDL.Text], [], []),
    'getChangeLogInventory' : IDL.Func([], [IDL.Text], ['query']),
    'setChangeLogInventory' : IDL.Func([IDL.Text], [], []),
    'getChangeLogBardana' : IDL.Func([], [IDL.Text], ['query']),
    'setChangeLogBardana' : IDL.Func([IDL.Text], [], []),
    'getTransactionLog' : IDL.Func([], [IDL.Text], ['query']),
    'setTransactionLog' : IDL.Func([IDL.Text], [], []),
    'getUsers' : IDL.Func([], [IDL.Text], ['query']),
    'setUsers' : IDL.Func([IDL.Text], [], []),
  });
};

export const init = ({ IDL }) => { return []; };
