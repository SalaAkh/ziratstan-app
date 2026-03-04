'use client'

import React, { useMemo, useCallback } from 'react'
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position,
    NodeProps,
    Node,
    Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import type { TreeProfile, TreeRelation } from '@/app/actions/tree.actions'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 220
const nodeHeight = 80

// Custom Node for the Profile Card
function ProfileNode({ data }: NodeProps<Node>) {
    const isMain = data.isMain
    return (
        <div className={`px-4 py-3 shadow-lg rounded-xl border-2 bg-[#111113] cursor-pointer hover:border-[#d4af37]/50 transition-colors flex items-center gap-3 w-[220px] ${isMain ? 'border-[#d4af37]' : 'border-white/10'}`}>
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[#d4af37]" />
            <div className="w-10 h-10 rounded-full border border-white/10 bg-[#18181b] flex items-center justify-center shrink-0 overflow-hidden text-[#d4af37] font-bold text-sm">
                {data['photo'] ? (
                    <Image src={String(data['photo'])} alt="P" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                ) : (
                    data['name'] ? String(data['name'])[0] : '?'
                )}
            </div>
            <div className="min-w-0">
                <div className={`font-bold text-sm truncate ${isMain ? 'text-[#d4af37]' : 'text-[#f4f4f5]'}`}>{String(data['name'])}</div>
                <div className="text-[10px] text-[#71717a] font-medium mt-0.5">
                    {data['birth'] ? new Date(String(data['birth'])).getFullYear() : '?'} — {data['death'] ? new Date(String(data['death'])).getFullYear() : '?'}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[#d4af37]" />
        </div>
    )
}

const nodeTypes = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profileNode: ProfileNode as any,
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    dagreGraph.setGraph({ rankdir: direction })

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
    })

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target)
    })

    dagre.layout(dagreGraph)

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id)
        node.targetPosition = Position.Top
        node.sourcePosition = Position.Bottom

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        }

        return node
    })

    return { nodes, edges }
}

export default function FamilyTree({
    mainProfile,
    relations,
}: {
    mainProfile: TreeProfile
    relations: TreeRelation[]
}) {
    const router = useRouter()

    const { initialNodes, initialEdges } = useMemo(() => {
        const nodes: Node[] = []
        const edges: Edge[] = []
        const addedIds = new Set<string>()

        // Add main node
        nodes.push({
            id: mainProfile.id,
            type: 'profileNode',
            data: {
                id: mainProfile.id,
                name: `${mainProfile.last_name || ''} ${mainProfile.first_name}`.trim(),
                birth: mainProfile.birth_date,
                death: mainProfile.death_date,
                photo: mainProfile.main_photo_url,
                isMain: true,
            },
            position: { x: 0, y: 0 },
        })
        addedIds.add(mainProfile.id)

        // Add relatives
        relations.forEach((rel) => {
            // Determine which one is the "other" profile
            const isProfile1Main = rel.profile_id_1 === mainProfile.id
            const otherProfile = isProfile1Main ? rel.profile2 : rel.profile1

            if (!otherProfile || addedIds.has(otherProfile.id)) return

            nodes.push({
                id: otherProfile.id,
                type: 'profileNode',
                data: {
                    id: otherProfile.id,
                    name: `${otherProfile.last_name || ''} ${otherProfile.first_name}`.trim(),
                    birth: otherProfile.birth_date,
                    death: otherProfile.death_date,
                    photo: otherProfile.main_photo_url,
                    isMain: false,
                },
                position: { x: 0, y: 0 },
            })
            addedIds.add(otherProfile.id)

            // Determine edge direction based on relation type
            // relation_type: how profile_2 relates to profile_1 (e.g. if 'child', profile_2 is child of profile_1)
            // So if 'parent', profile_2 is parent of profile_1. Source = profile_2, Target = profile_1.
            let source = ''
            let target = ''

            if (rel.relation_type === 'parent') {
                source = rel.profile_id_2
                target = rel.profile_id_1
            } else if (rel.relation_type === 'child') {
                source = rel.profile_id_1
                target = rel.profile_id_2
            } else {
                // sibling or spouse (horizontal/bidirectional)
                source = rel.profile_id_1
                target = rel.profile_id_2
            }

            edges.push({
                id: rel.id,
                source,
                target,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#d4af37', strokeWidth: 1.5, opacity: 0.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#d4af37' },
            })
        })

        const layouted = getLayoutedElements(nodes, edges)
        return { initialNodes: layouted.nodes, initialEdges: layouted.edges }
    }, [mainProfile, relations])

    const [nodes, , onNodesChange] = useNodesState(initialNodes)
    const [edges, , onEdgesChange] = useEdgesState(initialEdges)

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        // Navigate to relative's tree/profile if clicked
        if (node.id !== mainProfile.id) {
            router.push(`/profile/${node.id}`)
        }
    }, [router, mainProfile.id])

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 200px)', minHeight: '500px' }} className="rounded-2xl border border-white/5 overflow-hidden bg-[#09090b]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.5}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#71717a" gap={20} size={1} />
                <Controls showInteractive={false} className="fill-[#f4f4f5] bg-[#111113] border-white/10" />
            </ReactFlow>
        </div>
    )
}
