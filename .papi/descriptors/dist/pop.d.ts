import { StorageDescriptor, PlainDescriptor, TxDescriptor, RuntimeDescriptor, Enum, ApisFromDef, QueryFromPalletsDef, TxFromPalletsDef, EventsFromPalletsDef, ErrorsFromPalletsDef, ConstFromPalletsDef, ViewFnsFromPalletsDef, SS58String, FixedSizeBinary, Binary, FixedSizeArray } from "polkadot-api";
import { I5sesotjlssv2d, Iffmde3ekjedi9, I4mddgoa69c0a2, I12iau7abhvp14, I95g6i7ilua7lq, Ieniouoqkq4icf, Phase, Ie8n59eevgkj87, I4q39t5hn830vp, I1v7jbnil3tjns, I8jgj1nhcr2dg8, Ifn6q3equiq9qi, Ia3sb0vgvovhtg, Iav8k1edbj86k7, Itom7fk49o0c9, I4i91h98n3cv1b, I4iumukclgj8ej, Iqnbvitf7a7l3, I6r5cbv8ttrb09, Iepbsvlk3qceij, I1q8tnt1cluu5j, I8ds64oj6581v0, Ia7pdug7cdsg8g, Ifbpockjmajebe, I9bin2jc70qt6q, TransactionPaymentReleases, Iegmj7n48sc3am, Icgljjb6j82uhn, Ie9j1itogtv7p5, Ic5m5lp1oioo8r, I76dvde06adda, Ifvqn3ldat80ai, I99bb69usss9gs, Ia2lhg7l2hilo3, Ifi4da1gej1fri, Ifvgo9568rpmqc, I82jm9g7pufuel, I6cs1itejju2vv, I5014dfg3assdo, I56u24ncejr5kt, I9jd27rnpm8ttv, PreimageOldRequestStatus, PreimageRequestStatus, I4pact7n2e9a0i, Ib77b0fp1a6mjr, I5g2vv0ckl2m8b, Ifup3lg9ro8a0f, I5qfubnuvrnqn6, I8t3u2dv73ahbd, I7vlvrrl2pnbgk, Ie0rpl5bahldfk, XcmPalletVersionMigrationStage, I7e5oaj2qi4kl1, Ie849h3gncgvok, Iat62vud7hlod2, I53m8vgk813t0, Ibkm2gcn4pji30, XcmVersionedLocation, Idh2ug6ou4a8og, Iejeo53sea6n4q, I53esa2ms463bk, Ib4jhb8tt3uung, Idqnu98dduluv8, I7jr7fpe101ton, I58bf8c7kp5i84, I5kulbesqc1h1t, I36dvimehsh2tm, I8t4pajubp34g3, I32or1mos65f9o, I9p9lq3rej5bhc, Iag146hmjgqfgj, I8uo3fpd3bcc6f, I18m6a0sc4k7s9, Id32h28hjj1tch, I6ouflveob4eli, I7svnfko10tq2e, Ic9iokm15iigt6, I35m96p3u4vl0p, Iapmji0h53pmkn, Idrr42svup341f, I4ugih6gb4fmug, Ic9nev69d8grv1, Idac0t49lnd4ls, I72ndo6phms8ik, I1b2ckfeib3nig, I3qklfjubrljqh, Iag3f1hum3p4c8, I4s6jkha20aoh0, I2brm5b9jij1st, I78s05f59eoi8b, Idtkgtc4to05ia, I5t5eoogd7ekut, Ib1ql4t5slo00r, I95l2k9b1re95f, In7a38730s6qs, If15el53dd76v9, I9s0ave7t0vnrk, I4fo08joqmcqnm, Iasb8k6ash5mjn, Ijc5n210o8bbf, I3m5sq54sjdlso, I8ofcg5rbj0g2c, I4adgbll7gku4i, I6pjjpfvhvcfru, I9pj91mj79qekl, I39uah9nss64h9, Ik64dknsq7k08, Ib51vk42m1po4n, I60v7bikk54tpu, Ifpj261e8s63m3, Idcr6u6361oad9, Ibou4u1engb441, Id6nbvqoqdj4o2, I95iqep3b8snn9, I4ktuaksf5i1gk, I9bqtpv2ii35mp, I9j7pagd6d4bda, I2h9pmio37r7fb, Ibmr18suc9ikh9, I9iq22t0burs89, I5u8olqbbvfnvf, I5utcetro501ir, Icnrv1mfbd3in1, Icm9m0qeemu66d, I6qq5nnbjegi8u, I666bl2fqjkejo, I65k89p01c7fcj, Ib4q9jf1uph4bc, I8k3rnvpeeh4hv, Ib77pq85cp10ei, I38jfk5li8iang, Iacclckeoc6dqp, I8p0oc5o4vjmvt, I2dtrijkm5601t, I2ev73t79f46tb, Ib2obgji960euh, Ifccifqltb5obi, Iadtsfv699cq8b, Ialpmgmhr3gk5r, I4cbvqmqadhrea, I3sdol54kg5jaq, I8fougodaj6di6, I81vt5eq60l4b6, Icdon4tuliqbtj, I5n4sebgkfr760, I65763ebeio6mf, Ifs1i5fk9cqvr6, Id54so1b2erhs0, Iblrelnrotlf1f, Ieg3fd8p4pkt10, I8kg5ll427kfqq, I467333262q1l9, I82nfqfkd48n10, I1jm8m1rh9e20v, I3o5j3bli1pd8e, I3vh014cqgmrfd, Ieh0lckc0vpjc6, I21jsa919m88fd, I653g7mv3sqsvk, I9kt8c221c83ln, Ic76kfh5ebqkpl, Icscpmubum33bq, I21d2olof7eb60, Ibgm4rnf22lal1, Ie68np0vpihith, I8k1luiflpk9v7, Iauhjqifrdklq7, Ie1uso9m8rt5cf, I40pqum1mu8qg3, I1r4c2ghbtvjuc, I8upsupg73d8i4, Il479ga6jla1a, Iepqv071dqickc, I739ltdlbnqckb, I5nk49fqq83rft, Ivalbtb85o2h0, Ic8hk838gccoml, Ia2rnh5pfua40a, I3otc7e9a35k1k, I89ier5tb9ne0s, Im2f0numhevg3, I2agkcpojhkk43, I32rvg545edabm, I83fv0vi59md7i, I5tjjqcdd4tae0, I1894dm1lf1ae7, Ibg2pbq43u3kek, Iovrcu9bfelfq, Iefr8jgtgfk8um, I3j05hul54uj7q, I2eb501t8s6hsq, Ianmuoljk2sk1u, I4ffoom50mpgqs, Idn6i85kjn6h8r, Ifoi071p509ebc, Ideaemvoneh309, I3d9o9d7epp66v, I6lqh1vgb4mcja, I1pkn45df0p8gs, I5846tcbuvjclf, If62pc69t7sugd, Ifrfavu6fncvt3, I43aobns89nbkh, Iamd7rovec1hfb, I77ie723ncd4co, Ieebloeahma3ke, I4mbtpf4pu3rec, Iafkqus0ohh6l6, Ibgvkh96s68a66, If9vko7pv0231m, I1ahf3pvgsgbu, I736lv5q9m5bot, I9uapdn16emsti, Ie5i0q2glmr0md, I97qcg6i3l8gee, Ib5udrahak005b, Ib92t90p616grb, I1jj31tn29ie3c, I5llu6o6a0go5i, Ic8b8561e6t9ie, I93r2effh7od84, I6afd7fllr8otc, Icrkms46uh8tpb, I78u60nqh0etah, I6cu7obfo0rr0o, Ibqooroq6rr5kr, I6h88h8vba22v8, I1lso3vlgherue, Ia9cd4jqb5eecb, I19jiel1ftbcce, I26c8p47106toa, Iq82b3qvf20ne, Ic3j8ku6mbsms4, I3nvoqsi8f05ph, I3eoft5md071do, I923eug653ra0o, I9gf2bs80kgbnk, I5urb3tva4ave5, Ic357tcepuvo5c, I2rnoam876ruhj, Ic5b47dj4coa3r, Ib3qnc19gu633c, Ifira6u9hi7cu1, I72tqocvdoqfff, I2i27f3sfmvc05, I1nlrtd1epki2d, I3abtumcmempjs, Id81m8flopt8ha, I8hff7chabggkd, I49i39mtj1ivbs, Ifkr2kcak2vto1, I1ju6r8q0cs9jt, I4kpeq6j7cd5bu, I5na1ka76k6811, I59mhdb9omdqfa, I9vl5kpk0fpakt, I717jt61hu19b4, I7f7v8192r1lmq, Ida37oe44osb06, Idsg8aod8e8fqn, I46nktn22m6hbi, Ibgj1cthra7lte, I10ra4g1rl6k2f, I1uihehkdsggvp, I9tbfhd14k3gir, I7skr1ar9c2b3r, Iersu5s46p8jg1, I2obi88g7eeev0, I1rvj8qc6u04i2, I7m4m3sn3ouhp0, Ifiphvnhbdlk4m, I4ov6e94l79mbg, I21mg138mq0dm1, Ibcgh77idehr6f, Ia72crscsnehc6, Iasr6pj6shs0fl, I3iv5pqub2hu31, Ia82mnkmeo2rhc, Ib45rihle5v6ft, Icbccs0ug47ilf, I855j4i3kr8ko1, I2bfi6omkospl3, Idd7hd99u0ho0n, Iafscmv8tjf0ou, I100l07kaehdlp, I6gnbnvip5vvdi, If1co0pilmi7oq, Iae74gjak1qibn, I3escdojpj0551, Icv68aq8841478, Ic262ibdoec56a, Iflcfm9b6nlmdd, Ijrsf4mnp3eka, Id5fm4p8lj5qgi, I8tjvj9uq4b7hi, I3qt1hgg4djhgb, I4fooe9dun9o0t, Ier2cke86dqbr2, I8iksqi3eani0a, I16enopmju1p0q, I43kq8qudg7pq9, I76riseemre533, Ie5v6njpckr05b, I38bmcrmh852rk, I4hcillge8de5f, I8usdc6tg7829p, I79tt57ecc1u8d, I5rtkmhm2dng4u, Ift6f10887nk72, I7qc53b1tvqjg2, I6nu92s10o9433, Iak7fhrgb9jnnq, I9ad1o9mv4cm3, Iek4p2kbgm2db2, I39t01nnod9109, I6v8sm60vvkmk7, I1qmtmbe5so8r3, Ih99m6ehpcar7, Idgorhsbgdq2ap, I9ubb2kqevnu6t, I2hq50pu2kdjpo, I9acqruh7322g2, I8vb39n1b1sn86, Ia3c82eadg79bj, Ienusoeb625ftq, Ibtsa3docbr9el, I137t1cld92pod, Ia72eet39sf8j9, I9t9l8gsr9gbhc, Ibmuil6p3vl83l, I7lul91g50ae87, Icl7nl1rfeog3i, I2uqmls7kcdnii, Idg69klialbkb8, I7r6b7145022pp, I30pg328m00nr3, Icmrn7bogp28cs, I7m9b5plj4h5ot, I9onhk772nfs4f, I3l6bnksrmt56r, Idh09k0l2pmdcg, I7uoiphbm0tj4r, I512p1n7qt24l8, I6s1nbislhk619, I3gghqnh2mj0is, I6iv852roh6t3h, I9oc2o6itbiopq, Ibeto40kl3r5j7, I1rvj4ubaplho0, Ia3uu7lqcc1q1i, I7crucfnonitkn, I7tmrp94r9sq4n, Icuomvkc5d2ldo, Imnb7a0a14ts1, I9ljfa9qc631nt, I5ntoea33t507g, Icvhvdg4guj0u2, I6vqpfjes12rn2, I7qo7cp2e3aerl, I7hm2lpanae6vf, Ie5222qfrr24ek, I28g8sphdu312k, Idqbjt2c6r46t6, I853aigjva3f0t, I9uehhems5hkqm, I7q5qk4uoanhof, Iehpbs40l3jkit, Idht9upmipvd4j, Ieahie1iccmfd4, Ie7cuj84ohvg56, I2ur0oeqg495j8, I8ioopvokvl3ud, I1bhd210c3phjj, Iep27ialq4a7o7, Iasu5jvoqr43mv, I2n5q2h7q8c8g, I5qolde99acmd1, I8gtde5abn1g9a, I1s03nktomg1im, I58kt5j7s04it1, Iavf0ibu3abt42, I9gqanbbbe917p, Id1m1230297f7a, Ifvb1p5munhhv4, I46h83ilqeed3g, Icahse3uoi76n7, Ico8bnjc6taa27, I78i1bvlonei69, I5fjkvcb5vr6nb, I2gr1toekv86b9, I9i1f9mrso1hmf, I2v2ikqt2trp52, I9ksla2si91s56, If3057hi1g5qlo, Iaii5qf41d5n3d, Id9j7b85otvjru, Iaihk9pek2ajl9, Id9av23h47ufb2, Ib4kpnijas4jqp, I2vnu5k0u1i65h, Ib67harsthtcvr, Ic7ok3lq0728f7, I88ff3u4dpivk, I33cp947glv1ks, Ic9om1gmmqu7rq, I5hfov2b68ppb6, Ibthhb2m9vneds, Iaitn5bqfacj7k, If4ebvclj2ugvi, Ia5le7udkgbaq9, Ieduc1e6frq8rb, I9h6gbtabovtm4, Ifnsa0dkkpf465, I65dtqr2egjbc3, Ibqj3vg5s5lk0c, I6l73u513p8rna, Iefqmt2htu1dlu, If8bgtgqrchjtu, Idusmq77988cmt, I7svbvm6hg57aj, Ibrq3me0n6l1aa, Ib1lp1vvi0snto, Ib1tuirknugkf0, I9h4l0ivnpllq2, I9e44up6jrgtq8, I8lbid96jmoifn, I6f9cs95vga45t, I1q7llba29achm, I24fjcuv2i5g6p, I787j4cmbcfj1a, Iaqet9jc3ihboe, Ic952bubvq4k7d, I2v50gu3s1aqk6, Iabpgqcjikia83, I4gil44d08grh, I7u915mvkdsb08, Ibuckoe3pl0u61, If7uv525tdvv7a, I2an1fs2eiebjp, TransactionValidityTransactionSource, I9ask1o4tfvcvs, Icerf8h8pdu8ss, I6spmpef2c7svf, Iei2mvq0mjvt81, I35p85j063s0il, I5nl58rn9l3igg, I9sijb8gfrns29, Ifkjghks8m24kq, I2dfliekq1ed7e, I6sua9tbs1tvlp, I9u22scd4ksrjm, Ic1d4u2opv3fst, Ihfphjolmsqq1, I4arjljr6dpflb, I4totqt881mlti, I8gfbtjjcfvqul, I4s6vifaf8k998, I379a3mumkfm4u, Ie2utffa038qbn, I8abab09ak4pi1, Iehnkjehe1oeva, Ifbmd9e2argcmg, I2bl5e7he0kaq9, I2d63hfvrckrkc, Ibabtpgk9h20k6, I25ubidgt5kbu2, I88s970jldn57s, Ia1fc83d1vmh2g, I52u39k9vlndt2, I6opi5c2k8qt6q, Ianhcjhlrgugp, I5s9j68kl4u3ek, I67smi4kj2jg4u, XcmVersionedAsset, Icujp6hmv35vbn, I4tjame31218k9, I5gif8vomct5i8, Ie9sr1iqcg3cgm, I1mqgk2tmnn9i2, I6lr8sctk0bi4e, I8id3dvc1gaj6d } from "./common-types";
type AnonymousEnum<T extends {}> = T & {
    __anonymous: true;
};
type MyTuple<T> = [T, ...T[]];
type SeparateUndefined<T> = undefined extends T ? undefined | Exclude<T, undefined> : T;
type Anonymize<T> = SeparateUndefined<T extends FixedSizeBinary<infer L> ? number extends L ? Binary : FixedSizeBinary<L> : T extends string | number | bigint | boolean | void | undefined | null | symbol | Uint8Array | Enum<any> ? T : T extends AnonymousEnum<infer V> ? Enum<V> : T extends MyTuple<any> ? {
    [K in keyof T]: T[K];
} : T extends [] ? [] : T extends FixedSizeArray<infer L, infer T> ? number extends L ? Array<T> : FixedSizeArray<L, T> : {
    [K in keyof T & string]: T[K];
}>;
type IStorage = {
    System: {
        /**
         * The full account information for a particular account ID.
         */
        Account: StorageDescriptor<[Key: SS58String], Anonymize<I5sesotjlssv2d>, false, never>;
        /**
         * Total extrinsics count for the current block.
         */
        ExtrinsicCount: StorageDescriptor<[], number, true, never>;
        /**
         * Whether all inherents have been applied.
         */
        InherentsApplied: StorageDescriptor<[], boolean, false, never>;
        /**
         * The current weight for the block.
         */
        BlockWeight: StorageDescriptor<[], Anonymize<Iffmde3ekjedi9>, false, never>;
        /**
         * Total length (in bytes) for all extrinsics put together, for the current block.
         */
        AllExtrinsicsLen: StorageDescriptor<[], number, true, never>;
        /**
         * Map of block numbers to block hashes.
         */
        BlockHash: StorageDescriptor<[Key: number], FixedSizeBinary<32>, false, never>;
        /**
         * Extrinsics data for the current block (maps an extrinsic's index to its data).
         */
        ExtrinsicData: StorageDescriptor<[Key: number], Binary, false, never>;
        /**
         * The current block number being processed. Set by `execute_block`.
         */
        Number: StorageDescriptor<[], number, false, never>;
        /**
         * Hash of the previous block.
         */
        ParentHash: StorageDescriptor<[], FixedSizeBinary<32>, false, never>;
        /**
         * Digest of the current block, also part of the block header.
         */
        Digest: StorageDescriptor<[], Anonymize<I4mddgoa69c0a2>, false, never>;
        /**
         * Events deposited for the current block.
         *
         * NOTE: The item is unbound and should therefore never be read on chain.
         * It could otherwise inflate the PoV size of a block.
         *
         * Events have a large in-memory size. Box the events to not go out-of-memory
         * just in case someone still reads them from within the runtime.
         */
        Events: StorageDescriptor<[], Anonymize<I12iau7abhvp14>, false, never>;
        /**
         * The number of events in the `Events<T>` list.
         */
        EventCount: StorageDescriptor<[], number, false, never>;
        /**
         * Mapping between a topic (represented by T::Hash) and a vector of indexes
         * of events in the `<Events<T>>` list.
         *
         * All topic vectors have deterministic storage locations depending on the topic. This
         * allows light-clients to leverage the changes trie storage tracking mechanism and
         * in case of changes fetch the list of events of interest.
         *
         * The value has the type `(BlockNumberFor<T>, EventIndex)` because if we used only just
         * the `EventIndex` then in case if the topic has the same contents on the next block
         * no notification will be triggered thus the event might be lost.
         */
        EventTopics: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<I95g6i7ilua7lq>, false, never>;
        /**
         * Stores the `spec_version` and `spec_name` of when the last runtime upgrade happened.
         */
        LastRuntimeUpgrade: StorageDescriptor<[], Anonymize<Ieniouoqkq4icf>, true, never>;
        /**
         * True if we have upgraded so that `type RefCount` is `u32`. False (default) if not.
         */
        UpgradedToU32RefCount: StorageDescriptor<[], boolean, false, never>;
        /**
         * True if we have upgraded so that AccountInfo contains three types of `RefCount`. False
         * (default) if not.
         */
        UpgradedToTripleRefCount: StorageDescriptor<[], boolean, false, never>;
        /**
         * The execution phase of the block.
         */
        ExecutionPhase: StorageDescriptor<[], Phase, true, never>;
        /**
         * `Some` if a code upgrade has been authorized.
         */
        AuthorizedUpgrade: StorageDescriptor<[], Anonymize<Ie8n59eevgkj87>, true, never>;
        /**
         * The weight reclaimed for the extrinsic.
         *
         * This information is available until the end of the extrinsic execution.
         * More precisely this information is removed in `note_applied_extrinsic`.
         *
         * Logic doing some post dispatch weight reduction must update this storage to avoid duplicate
         * reduction.
         */
        ExtrinsicWeightReclaimed: StorageDescriptor<[], Anonymize<I4q39t5hn830vp>, false, never>;
    };
    ParachainSystem: {
        /**
         * Latest included block descendants the runtime accepted. In other words, these are
         * ancestors of the currently executing block which have not been included in the observed
         * relay-chain state.
         *
         * The segment length is limited by the capacity returned from the [`ConsensusHook`] configured
         * in the pallet.
         */
        UnincludedSegment: StorageDescriptor<[], Anonymize<I1v7jbnil3tjns>, false, never>;
        /**
         * Storage field that keeps track of bandwidth used by the unincluded segment along with the
         * latest HRMP watermark. Used for limiting the acceptance of new blocks with
         * respect to relay chain constraints.
         */
        AggregatedUnincludedSegment: StorageDescriptor<[], Anonymize<I8jgj1nhcr2dg8>, true, never>;
        /**
         * In case of a scheduled upgrade, this storage field contains the validation code to be
         * applied.
         *
         * As soon as the relay chain gives us the go-ahead signal, we will overwrite the
         * [`:code`][sp_core::storage::well_known_keys::CODE] which will result the next block process
         * with the new validation code. This concludes the upgrade process.
         */
        PendingValidationCode: StorageDescriptor<[], Binary, false, never>;
        /**
         * Validation code that is set by the parachain and is to be communicated to collator and
         * consequently the relay-chain.
         *
         * This will be cleared in `on_initialize` of each new block if no other pallet already set
         * the value.
         */
        NewValidationCode: StorageDescriptor<[], Binary, true, never>;
        /**
         * The [`PersistedValidationData`] set for this block.
         * This value is expected to be set only once per block and it's never stored
         * in the trie.
         */
        ValidationData: StorageDescriptor<[], Anonymize<Ifn6q3equiq9qi>, true, never>;
        /**
         * Were the validation data set to notify the relay chain?
         */
        DidSetValidationCode: StorageDescriptor<[], boolean, false, never>;
        /**
         * The relay chain block number associated with the last parachain block.
         *
         * This is updated in `on_finalize`.
         */
        LastRelayChainBlockNumber: StorageDescriptor<[], number, false, never>;
        /**
         * An option which indicates if the relay-chain restricts signalling a validation code upgrade.
         * In other words, if this is `Some` and [`NewValidationCode`] is `Some` then the produced
         * candidate will be invalid.
         *
         * This storage item is a mirror of the corresponding value for the current parachain from the
         * relay-chain. This value is ephemeral which means it doesn't hit the storage. This value is
         * set after the inherent.
         */
        UpgradeRestrictionSignal: StorageDescriptor<[], Anonymize<Ia3sb0vgvovhtg>, false, never>;
        /**
         * Optional upgrade go-ahead signal from the relay-chain.
         *
         * This storage item is a mirror of the corresponding value for the current parachain from the
         * relay-chain. This value is ephemeral which means it doesn't hit the storage. This value is
         * set after the inherent.
         */
        UpgradeGoAhead: StorageDescriptor<[], Anonymize<Iav8k1edbj86k7>, false, never>;
        /**
         * The state proof for the last relay parent block.
         *
         * This field is meant to be updated each block with the validation data inherent. Therefore,
         * before processing of the inherent, e.g. in `on_initialize` this data may be stale.
         *
         * This data is also absent from the genesis.
         */
        RelayStateProof: StorageDescriptor<[], Anonymize<Itom7fk49o0c9>, true, never>;
        /**
         * The snapshot of some state related to messaging relevant to the current parachain as per
         * the relay parent.
         *
         * This field is meant to be updated each block with the validation data inherent. Therefore,
         * before processing of the inherent, e.g. in `on_initialize` this data may be stale.
         *
         * This data is also absent from the genesis.
         */
        RelevantMessagingState: StorageDescriptor<[], Anonymize<I4i91h98n3cv1b>, true, never>;
        /**
         * The parachain host configuration that was obtained from the relay parent.
         *
         * This field is meant to be updated each block with the validation data inherent. Therefore,
         * before processing of the inherent, e.g. in `on_initialize` this data may be stale.
         *
         * This data is also absent from the genesis.
         */
        HostConfiguration: StorageDescriptor<[], Anonymize<I4iumukclgj8ej>, true, never>;
        /**
         * The last downward message queue chain head we have observed.
         *
         * This value is loaded before and saved after processing inbound downward messages carried
         * by the system inherent.
         */
        LastDmqMqcHead: StorageDescriptor<[], FixedSizeBinary<32>, false, never>;
        /**
         * The message queue chain heads we have observed per each channel incoming channel.
         *
         * This value is loaded before and saved after processing inbound downward messages carried
         * by the system inherent.
         */
        LastHrmpMqcHeads: StorageDescriptor<[], Anonymize<Iqnbvitf7a7l3>, false, never>;
        /**
         * Number of downward messages processed in a block.
         *
         * This will be cleared in `on_initialize` of each new block.
         */
        ProcessedDownwardMessages: StorageDescriptor<[], number, false, never>;
        /**
         * HRMP watermark that was set in a block.
         *
         * This will be cleared in `on_initialize` of each new block.
         */
        HrmpWatermark: StorageDescriptor<[], number, false, never>;
        /**
         * HRMP messages that were sent in a block.
         *
         * This will be cleared in `on_initialize` of each new block.
         */
        HrmpOutboundMessages: StorageDescriptor<[], Anonymize<I6r5cbv8ttrb09>, false, never>;
        /**
         * Upward messages that were sent in a block.
         *
         * This will be cleared in `on_initialize` of each new block.
         */
        UpwardMessages: StorageDescriptor<[], Anonymize<Itom7fk49o0c9>, false, never>;
        /**
         * Upward messages that are still pending and not yet send to the relay chain.
         */
        PendingUpwardMessages: StorageDescriptor<[], Anonymize<Itom7fk49o0c9>, false, never>;
        /**
         * The factor to multiply the base delivery fee by for UMP.
         */
        UpwardDeliveryFeeFactor: StorageDescriptor<[], bigint, false, never>;
        /**
         * The number of HRMP messages we observed in `on_initialize` and thus used that number for
         * announcing the weight of `on_initialize` and `on_finalize`.
         */
        AnnouncedHrmpMessagesPerCandidate: StorageDescriptor<[], number, false, never>;
        /**
         * The weight we reserve at the beginning of the block for processing XCMP messages. This
         * overrides the amount set in the Config trait.
         */
        ReservedXcmpWeightOverride: StorageDescriptor<[], Anonymize<I4q39t5hn830vp>, true, never>;
        /**
         * The weight we reserve at the beginning of the block for processing DMP messages. This
         * overrides the amount set in the Config trait.
         */
        ReservedDmpWeightOverride: StorageDescriptor<[], Anonymize<I4q39t5hn830vp>, true, never>;
        /**
         * A custom head data that should be returned as result of `validate_block`.
         *
         * See `Pallet::set_custom_validation_head_data` for more information.
         */
        CustomValidationHeadData: StorageDescriptor<[], Binary, true, never>;
    };
    Timestamp: {
        /**
         * The current time for the current block.
         */
        Now: StorageDescriptor<[], bigint, false, never>;
        /**
         * Whether the timestamp has been updated in this block.
         *
         * This value is updated to `true` upon successful submission of a timestamp by a node.
         * It is then checked at the end of each block execution in the `on_finalize` hook.
         */
        DidUpdate: StorageDescriptor<[], boolean, false, never>;
    };
    ParachainInfo: {
        /**
        
         */
        ParachainId: StorageDescriptor<[], number, false, never>;
    };
    MultiBlockMigrations: {
        /**
         * The currently active migration to run and its cursor.
         *
         * `None` indicates that no migration is running.
         */
        Cursor: StorageDescriptor<[], Anonymize<Iepbsvlk3qceij>, true, never>;
        /**
         * Set of all successfully executed migrations.
         *
         * This is used as blacklist, to not re-execute migrations that have not been removed from the
         * codebase yet. Governance can regularly clear this out via `clear_historic`.
         */
        Historic: StorageDescriptor<[Key: Binary], null, true, never>;
    };
    Balances: {
        /**
         * The total units issued in the system.
         */
        TotalIssuance: StorageDescriptor<[], bigint, false, never>;
        /**
         * The total units of outstanding deactivated balance in the system.
         */
        InactiveIssuance: StorageDescriptor<[], bigint, false, never>;
        /**
         * The Balances pallet example of storing the balance of an account.
         *
         * # Example
         *
         * ```nocompile
         * impl pallet_balances::Config for Runtime {
         * type AccountStore = StorageMapShim<Self::Account<Runtime>, frame_system::Provider<Runtime>, AccountId, Self::AccountData<Balance>>
         * }
         * ```
         *
         * You can also store the balance of an account in the `System` pallet.
         *
         * # Example
         *
         * ```nocompile
         * impl pallet_balances::Config for Runtime {
         * type AccountStore = System
         * }
         * ```
         *
         * But this comes with tradeoffs, storing account balances in the system pallet stores
         * `frame_system` data alongside the account data contrary to storing account balances in the
         * `Balances` pallet, which uses a `StorageMap` to store balances data only.
         * NOTE: This is only used in the case that this pallet is used to store balances.
         */
        Account: StorageDescriptor<[Key: SS58String], Anonymize<I1q8tnt1cluu5j>, false, never>;
        /**
         * Any liquidity locks on some account balances.
         * NOTE: Should only be accessed when setting, changing and freeing a lock.
         *
         * Use of locks is deprecated in favour of freezes. See `https://github.com/paritytech/substrate/pull/12951/`
         */
        Locks: StorageDescriptor<[Key: SS58String], Anonymize<I8ds64oj6581v0>, false, never>;
        /**
         * Named reserves on some account balances.
         *
         * Use of reserves is deprecated in favour of holds. See `https://github.com/paritytech/substrate/pull/12951/`
         */
        Reserves: StorageDescriptor<[Key: SS58String], Anonymize<Ia7pdug7cdsg8g>, false, never>;
        /**
         * Holds on account balances.
         */
        Holds: StorageDescriptor<[Key: SS58String], Anonymize<Ifbpockjmajebe>, false, never>;
        /**
         * Freeze locks on account balances.
         */
        Freezes: StorageDescriptor<[Key: SS58String], Anonymize<I9bin2jc70qt6q>, false, never>;
    };
    TransactionPayment: {
        /**
        
         */
        NextFeeMultiplier: StorageDescriptor<[], bigint, false, never>;
        /**
        
         */
        StorageVersion: StorageDescriptor<[], TransactionPaymentReleases, false, never>;
    };
    Treasury: {
        /**
         * DEPRECATED: associated with `spend_local` call and will be removed in May 2025.
         * Refer to <https://github.com/paritytech/polkadot-sdk/pull/5961> for migration to `spend`.
         *
         * Number of proposals that have been made.
         */
        ProposalCount: StorageDescriptor<[], number, false, never>;
        /**
         * DEPRECATED: associated with `spend_local` call and will be removed in May 2025.
         * Refer to <https://github.com/paritytech/polkadot-sdk/pull/5961> for migration to `spend`.
         *
         * Proposals that have been made.
         */
        Proposals: StorageDescriptor<[Key: number], Anonymize<Iegmj7n48sc3am>, true, never>;
        /**
         * The amount which has been reported as inactive to Currency.
         */
        Deactivated: StorageDescriptor<[], bigint, false, never>;
        /**
         * DEPRECATED: associated with `spend_local` call and will be removed in May 2025.
         * Refer to <https://github.com/paritytech/polkadot-sdk/pull/5961> for migration to `spend`.
         *
         * Proposal indices that have been approved but not yet awarded.
         */
        Approvals: StorageDescriptor<[], Anonymize<Icgljjb6j82uhn>, false, never>;
        /**
         * The count of spends that have been made.
         */
        SpendCount: StorageDescriptor<[], number, false, never>;
        /**
         * Spends that have been approved and being processed.
         */
        Spends: StorageDescriptor<[Key: number], Anonymize<Ie9j1itogtv7p5>, true, never>;
        /**
         * The blocknumber for the last triggered spend period.
         */
        LastSpendPeriod: StorageDescriptor<[], number, true, never>;
    };
    Sudo: {
        /**
         * The `AccountId` of the sudo key.
         */
        Key: StorageDescriptor<[], SS58String, true, never>;
    };
    Council: {
        /**
         * The hashes of the active proposals.
         */
        Proposals: StorageDescriptor<[], Anonymize<Ic5m5lp1oioo8r>, false, never>;
        /**
         * Actual proposal for a given hash, if it's current.
         */
        ProposalOf: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<I76dvde06adda>, true, never>;
        /**
         * Consideration cost created for publishing and storing a proposal.
         *
         * Determined by [Config::Consideration] and may be not present for certain proposals (e.g. if
         * the proposal count at the time of creation was below threshold N).
         */
        CostOf: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<Ifvqn3ldat80ai>, true, never>;
        /**
         * Votes on a given proposal, if it is ongoing.
         */
        Voting: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<I99bb69usss9gs>, true, never>;
        /**
         * Proposals so far.
         */
        ProposalCount: StorageDescriptor<[], number, false, never>;
        /**
         * The current members of the collective. This is stored sorted (just by value).
         */
        Members: StorageDescriptor<[], Anonymize<Ia2lhg7l2hilo3>, false, never>;
        /**
         * The prime member that helps determine the default vote behavior in case of abstentions.
         */
        Prime: StorageDescriptor<[], SS58String, true, never>;
    };
    Authorship: {
        /**
         * Author of current block.
         */
        Author: StorageDescriptor<[], SS58String, true, never>;
    };
    CollatorSelection: {
        /**
         * The invulnerable, permissioned collators. This list must be sorted.
         */
        Invulnerables: StorageDescriptor<[], Anonymize<Ia2lhg7l2hilo3>, false, never>;
        /**
         * The (community, limited) collation candidates. `Candidates` and `Invulnerables` should be
         * mutually exclusive.
         *
         * This list is sorted in ascending order by deposit and when the deposits are equal, the least
         * recently updated is considered greater.
         */
        CandidateList: StorageDescriptor<[], Anonymize<Ifi4da1gej1fri>, false, never>;
        /**
         * Last block authored by collator.
         */
        LastAuthoredBlock: StorageDescriptor<[Key: SS58String], number, false, never>;
        /**
         * Desired number of candidates.
         *
         * This should ideally always be less than [`Config::MaxCandidates`] for weights to be correct.
         */
        DesiredCandidates: StorageDescriptor<[], number, false, never>;
        /**
         * Fixed amount to deposit to become a collator.
         *
         * When a collator calls `leave_intent` they immediately receive the deposit back.
         */
        CandidacyBond: StorageDescriptor<[], bigint, false, never>;
    };
    Session: {
        /**
         * The current set of validators.
         */
        Validators: StorageDescriptor<[], Anonymize<Ia2lhg7l2hilo3>, false, never>;
        /**
         * Current index of the session.
         */
        CurrentIndex: StorageDescriptor<[], number, false, never>;
        /**
         * True if the underlying economic identities or weighting behind the validators
         * has changed in the queued validator set.
         */
        QueuedChanged: StorageDescriptor<[], boolean, false, never>;
        /**
         * The queued keys for the next session. When the next session begins, these keys
         * will be used to determine the validator's session keys.
         */
        QueuedKeys: StorageDescriptor<[], Anonymize<Ifvgo9568rpmqc>, false, never>;
        /**
         * Indices of disabled validators.
         *
         * The vec is always kept sorted so that we can find whether a given validator is
         * disabled using binary search. It gets cleared when `on_session_ending` returns
         * a new set of identities.
         */
        DisabledValidators: StorageDescriptor<[], Anonymize<I95g6i7ilua7lq>, false, never>;
        /**
         * The next session keys for a validator.
         */
        NextKeys: StorageDescriptor<[Key: SS58String], FixedSizeBinary<32>, true, never>;
        /**
         * The owner of a key. The key is the `KeyTypeId` + the encoded key.
         */
        KeyOwner: StorageDescriptor<[Key: Anonymize<I82jm9g7pufuel>], SS58String, true, never>;
    };
    Aura: {
        /**
         * The current authority set.
         */
        Authorities: StorageDescriptor<[], Anonymize<Ic5m5lp1oioo8r>, false, never>;
        /**
         * The current slot of this block.
         *
         * This will be set in `on_initialize`.
         */
        CurrentSlot: StorageDescriptor<[], bigint, false, never>;
    };
    AuraExt: {
        /**
         * Serves as cache for the authorities.
         *
         * The authorities in AuRa are overwritten in `on_initialize` when we switch to a new session,
         * but we require the old authorities to verify the seal when validating a PoV. This will
         * always be updated to the latest AuRa authorities in `on_finalize`.
         */
        Authorities: StorageDescriptor<[], Anonymize<Ic5m5lp1oioo8r>, false, never>;
        /**
         * Current relay chain slot paired with a number of authored blocks.
         *
         * This is updated in [`FixedVelocityConsensusHook::on_state_proof`] with the current relay
         * chain slot as provided by the relay chain state proof.
         */
        RelaySlotInfo: StorageDescriptor<[], Anonymize<I6cs1itejju2vv>, true, never>;
    };
    Scheduler: {
        /**
         * Block number at which the agenda began incomplete execution.
         */
        IncompleteSince: StorageDescriptor<[], number, true, never>;
        /**
         * Items to be executed, indexed by the block number that they should be executed on.
         */
        Agenda: StorageDescriptor<[Key: number], Anonymize<I5014dfg3assdo>, false, never>;
        /**
         * Retry configurations for items to be executed, indexed by task address.
         */
        Retries: StorageDescriptor<[Key: Anonymize<I9jd27rnpm8ttv>], Anonymize<I56u24ncejr5kt>, true, never>;
        /**
         * Lookup from a name to the block number and index of the task.
         *
         * For v3 -> v4 the previously unbounded identities are Blake2-256 hashed to form the v4
         * identities.
         */
        Lookup: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<I9jd27rnpm8ttv>, true, never>;
    };
    Preimage: {
        /**
         * The request status of a given hash.
         */
        StatusFor: StorageDescriptor<[Key: FixedSizeBinary<32>], PreimageOldRequestStatus, true, never>;
        /**
         * The request status of a given hash.
         */
        RequestStatusFor: StorageDescriptor<[Key: FixedSizeBinary<32>], PreimageRequestStatus, true, never>;
        /**
        
         */
        PreimageFor: StorageDescriptor<[Key: Anonymize<I4pact7n2e9a0i>], Binary, true, never>;
    };
    XcmpQueue: {
        /**
         * The suspended inbound XCMP channels. All others are not suspended.
         *
         * This is a `StorageValue` instead of a `StorageMap` since we expect multiple reads per block
         * to different keys with a one byte payload. The access to `BoundedBTreeSet` will be cached
         * within the block and therefore only included once in the proof size.
         *
         * NOTE: The PoV benchmarking cannot know this and will over-estimate, but the actual proof
         * will be smaller.
         */
        InboundXcmpSuspended: StorageDescriptor<[], Anonymize<Icgljjb6j82uhn>, false, never>;
        /**
         * The non-empty XCMP channels in order of becoming non-empty, and the index of the first
         * and last outbound message. If the two indices are equal, then it indicates an empty
         * queue and there must be a non-`Ok` `OutboundStatus`. We assume queues grow no greater
         * than 65535 items. Queue indices for normal messages begin at one; zero is reserved in
         * case of the need to send a high-priority signal message this block.
         * The bool is true if there is a signal message waiting to be sent.
         */
        OutboundXcmpStatus: StorageDescriptor<[], Anonymize<Ib77b0fp1a6mjr>, false, never>;
        /**
         * The messages outbound in a given XCMP channel.
         */
        OutboundXcmpMessages: StorageDescriptor<Anonymize<I5g2vv0ckl2m8b>, Binary, false, never>;
        /**
         * Any signal messages waiting to be sent.
         */
        SignalMessages: StorageDescriptor<[Key: number], Binary, false, never>;
        /**
         * The configuration which controls the dynamics of the outbound queue.
         */
        QueueConfig: StorageDescriptor<[], Anonymize<Ifup3lg9ro8a0f>, false, never>;
        /**
         * Whether or not the XCMP queue is suspended from executing incoming XCMs or not.
         */
        QueueSuspended: StorageDescriptor<[], boolean, false, never>;
        /**
         * The factor to multiply the base delivery fee by.
         */
        DeliveryFeeFactor: StorageDescriptor<[Key: number], bigint, false, never>;
    };
    PolkadotXcm: {
        /**
         * The latest available query index.
         */
        QueryCounter: StorageDescriptor<[], bigint, false, never>;
        /**
         * The ongoing queries.
         */
        Queries: StorageDescriptor<[Key: bigint], Anonymize<I5qfubnuvrnqn6>, true, never>;
        /**
         * The existing asset traps.
         *
         * Key is the blake2 256 hash of (origin, versioned `Assets`) pair. Value is the number of
         * times this pair has been trapped (usually just 1 if it exists at all).
         */
        AssetTraps: StorageDescriptor<[Key: FixedSizeBinary<32>], number, false, never>;
        /**
         * Default version to encode XCM when latest version of destination is unknown. If `None`,
         * then the destinations whose XCM version is unknown are considered unreachable.
         */
        SafeXcmVersion: StorageDescriptor<[], number, true, never>;
        /**
         * The Latest versions that we know various locations support.
         */
        SupportedVersion: StorageDescriptor<Anonymize<I8t3u2dv73ahbd>, number, true, never>;
        /**
         * All locations that we have requested version notifications from.
         */
        VersionNotifiers: StorageDescriptor<Anonymize<I8t3u2dv73ahbd>, bigint, true, never>;
        /**
         * The target locations that are subscribed to our version changes, as well as the most recent
         * of our versions we informed them of.
         */
        VersionNotifyTargets: StorageDescriptor<Anonymize<I8t3u2dv73ahbd>, Anonymize<I7vlvrrl2pnbgk>, true, never>;
        /**
         * Destinations whose latest XCM version we would like to know. Duplicates not allowed, and
         * the `u32` counter is the number of times that a send to the destination has been attempted,
         * which is used as a prioritization.
         */
        VersionDiscoveryQueue: StorageDescriptor<[], Anonymize<Ie0rpl5bahldfk>, false, never>;
        /**
         * The current migration's stage, if any.
         */
        CurrentMigration: StorageDescriptor<[], XcmPalletVersionMigrationStage, true, never>;
        /**
         * Fungible assets which we know are locked on a remote chain.
         */
        RemoteLockedFungibles: StorageDescriptor<Anonymize<Ie849h3gncgvok>, Anonymize<I7e5oaj2qi4kl1>, true, never>;
        /**
         * Fungible assets which we know are locked on this chain.
         */
        LockedFungibles: StorageDescriptor<[Key: SS58String], Anonymize<Iat62vud7hlod2>, true, never>;
        /**
         * Global suspension state of the XCM executor.
         */
        XcmExecutionSuspended: StorageDescriptor<[], boolean, false, never>;
        /**
         * Whether or not incoming XCMs (both executed locally and received) should be recorded.
         * Only one XCM program will be recorded at a time.
         * This is meant to be used in runtime APIs, and it's advised it stays false
         * for all other use cases, so as to not degrade regular performance.
         *
         * Only relevant if this pallet is being used as the [`xcm_executor::traits::RecordXcm`]
         * implementation in the XCM executor configuration.
         */
        ShouldRecordXcm: StorageDescriptor<[], boolean, false, never>;
        /**
         * If [`ShouldRecordXcm`] is set to true, then the last XCM program executed locally
         * will be stored here.
         * Runtime APIs can fetch the XCM that was executed by accessing this value.
         *
         * Only relevant if this pallet is being used as the [`xcm_executor::traits::RecordXcm`]
         * implementation in the XCM executor configuration.
         */
        RecordedXcm: StorageDescriptor<[], Anonymize<I53m8vgk813t0>, true, never>;
        /**
         * Map of authorized aliasers of local origins. Each local location can authorize a list of
         * other locations to alias into it. Each aliaser is only valid until its inner `expiry`
         * block number.
         */
        AuthorizedAliases: StorageDescriptor<[Key: XcmVersionedLocation], Anonymize<Ibkm2gcn4pji30>, true, never>;
    };
    MessageQueue: {
        /**
         * The index of the first and last (non-empty) pages.
         */
        BookStateFor: StorageDescriptor<[Key: Anonymize<Iejeo53sea6n4q>], Anonymize<Idh2ug6ou4a8og>, false, never>;
        /**
         * The origin at which we should begin servicing.
         */
        ServiceHead: StorageDescriptor<[], Anonymize<Iejeo53sea6n4q>, true, never>;
        /**
         * The map of page indices to pages.
         */
        Pages: StorageDescriptor<Anonymize<Ib4jhb8tt3uung>, Anonymize<I53esa2ms463bk>, true, never>;
    };
    Ismp: {
        /**
         * Holds a map of state machine heights to their verified state commitments. These state
         * commitments end up here after they are successfully verified by a `ConsensusClient`
         */
        StateCommitments: StorageDescriptor<[Key: Anonymize<I7jr7fpe101ton>], Anonymize<Idqnu98dduluv8>, true, never>;
        /**
         * Holds a map of consensus state identifiers to their consensus state.
         */
        ConsensusStates: StorageDescriptor<[Key: FixedSizeBinary<4>], Binary, true, never>;
        /**
         * A mapping of consensus state identifier to it's associated consensus client identifier
         */
        ConsensusStateClient: StorageDescriptor<[Key: FixedSizeBinary<4>], FixedSizeBinary<4>, true, never>;
        /**
         * A mapping of consensus state identifiers to their unbonding periods
         */
        UnbondingPeriod: StorageDescriptor<[Key: FixedSizeBinary<4>], bigint, true, never>;
        /**
         * A mapping of state machine Ids to their challenge periods
         */
        ChallengePeriod: StorageDescriptor<[Key: Anonymize<I58bf8c7kp5i84>], bigint, true, never>;
        /**
         * Holds a map of consensus clients frozen due to byzantine
         * behaviour
         */
        FrozenConsensusClients: StorageDescriptor<[Key: FixedSizeBinary<4>], boolean, false, never>;
        /**
         * The latest verified height for a state machine
         */
        LatestStateMachineHeight: StorageDescriptor<[Key: Anonymize<I58bf8c7kp5i84>], bigint, true, never>;
        /**
         * Holds the timestamp at which a consensus client was recently updated.
         * Used in ensuring that the configured challenge period elapses.
         */
        ConsensusClientUpdateTime: StorageDescriptor<[Key: FixedSizeBinary<4>], bigint, true, never>;
        /**
         * Holds the timestamp at which a state machine height was updated.
         * Used in ensuring that the configured challenge period elapses.
         */
        StateMachineUpdateTime: StorageDescriptor<[Key: Anonymize<I7jr7fpe101ton>], bigint, true, never>;
        /**
         * Tracks requests that have been responded to
         * The key is the request commitment
         */
        Responded: StorageDescriptor<[Key: FixedSizeBinary<32>], boolean, false, never>;
        /**
         * Latest nonce for messages sent from this chain
         */
        Nonce: StorageDescriptor<[], bigint, false, never>;
        /**
         * The child trie root of messages
         */
        ChildTrieRoot: StorageDescriptor<[], FixedSizeBinary<32>, false, never>;
    };
    IsmpParachain: {
        /**
         * Mapping of relay chain heights to it's state commitment. The state commitment of the parent
         * relay block is inserted at every block in `on_finalize`. This commitment is gotten from
         * parachain-system.
         */
        RelayChainStateCommitments: StorageDescriptor<[Key: number], FixedSizeBinary<32>, true, never>;
        /**
         * Tracks whether we've already seen the `update_parachain_consensus` inherent
         */
        ConsensusUpdated: StorageDescriptor<[], boolean, true, never>;
        /**
         * List of parachains that this state machine is interested in.
         */
        Parachains: StorageDescriptor<[Key: number], bigint, true, never>;
    };
    Contracts: {
        /**
         * A mapping from a contract's code hash to its code.
         */
        PristineCode: StorageDescriptor<[Key: FixedSizeBinary<32>], Binary, true, never>;
        /**
         * A mapping from a contract's code hash to its code info.
         */
        CodeInfoOf: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<I5kulbesqc1h1t>, true, never>;
        /**
         * This is a **monotonic** counter incremented on contract instantiation.
         *
         * This is used in order to generate unique trie ids for contracts.
         * The trie id of a new contract is calculated from hash(account_id, nonce).
         * The nonce is required because otherwise the following sequence would lead to
         * a possible collision of storage:
         *
         * 1. Create a new contract.
         * 2. Terminate the contract.
         * 3. Immediately recreate the contract with the same account_id.
         *
         * This is bad because the contents of a trie are deleted lazily and there might be
         * storage of the old instantiation still in it when the new contract is created. Please
         * note that we can't replace the counter by the block number because the sequence above
         * can happen in the same block. We also can't keep the account counter in memory only
         * because storage is the only way to communicate across different extrinsics in the
         * same block.
         *
         * # Note
         *
         * Do not use it to determine the number of contracts. It won't be decremented if
         * a contract is destroyed.
         */
        Nonce: StorageDescriptor<[], bigint, false, never>;
        /**
         * The code associated with a given account.
         *
         * TWOX-NOTE: SAFE since `AccountId` is a secure hash.
         */
        ContractInfoOf: StorageDescriptor<[Key: SS58String], Anonymize<I36dvimehsh2tm>, true, never>;
        /**
         * Evicted contracts that await child trie deletion.
         *
         * Child trie deletion is a heavy operation depending on the amount of storage items
         * stored in said trie. Therefore this operation is performed lazily in `on_idle`.
         */
        DeletionQueue: StorageDescriptor<[Key: number], Binary, true, never>;
        /**
         * A pair of monotonic counters used to track the latest contract marked for deletion
         * and the latest deleted contract in queue.
         */
        DeletionQueueCounter: StorageDescriptor<[], Anonymize<I8t4pajubp34g3>, false, never>;
        /**
         * A migration can span across multiple blocks. This storage defines a cursor to track the
         * progress of the migration, enabling us to resume from the last completed position.
         */
        MigrationInProgress: StorageDescriptor<[], Binary, true, never>;
    };
    Proxy: {
        /**
         * The set of account proxies. Maps the account which has delegated to the accounts
         * which are being delegated to, together with the amount held on deposit.
         */
        Proxies: StorageDescriptor<[Key: SS58String], Anonymize<I32or1mos65f9o>, false, never>;
        /**
         * The announcements made by the proxy (key).
         */
        Announcements: StorageDescriptor<[Key: SS58String], Anonymize<I9p9lq3rej5bhc>, false, never>;
    };
    Multisig: {
        /**
         * The set of open multisig operations.
         */
        Multisigs: StorageDescriptor<Anonymize<I8uo3fpd3bcc6f>, Anonymize<Iag146hmjgqfgj>, true, never>;
    };
    Nfts: {
        /**
         * Details of a collection.
         */
        Collection: StorageDescriptor<[Key: number], Anonymize<I18m6a0sc4k7s9>, true, never>;
        /**
         * The collection, if any, of which an account is willing to take ownership.
         */
        OwnershipAcceptance: StorageDescriptor<[Key: SS58String], number, true, never>;
        /**
         * The items held by any given account; set out this way so that items owned by a single
         * account can be enumerated.
         */
        Account: StorageDescriptor<Anonymize<Id32h28hjj1tch>, null, true, never>;
        /**
         * The collections owned by any given account; set out this way so that collections owned by
         * a single account can be enumerated.
         */
        CollectionAccount: StorageDescriptor<Anonymize<I6ouflveob4eli>, null, true, never>;
        /**
         * The items in existence and their ownership details.
         * Stores collection roles as per account.
         */
        CollectionRoleOf: StorageDescriptor<Anonymize<I7svnfko10tq2e>, number, true, never>;
        /**
         * The items in existence and their ownership details.
         */
        Item: StorageDescriptor<Anonymize<I9jd27rnpm8ttv>, Anonymize<Ic9iokm15iigt6>, true, never>;
        /**
         * Metadata of a collection.
         */
        CollectionMetadataOf: StorageDescriptor<[Key: number], Anonymize<I35m96p3u4vl0p>, true, never>;
        /**
         * Metadata of an item.
         */
        ItemMetadataOf: StorageDescriptor<Anonymize<I9jd27rnpm8ttv>, Anonymize<Iapmji0h53pmkn>, true, never>;
        /**
         * Attributes of a collection.
         */
        Attribute: StorageDescriptor<Anonymize<I4ugih6gb4fmug>, Anonymize<Idrr42svup341f>, true, never>;
        /**
         * A price of an item.
         */
        ItemPriceOf: StorageDescriptor<Anonymize<I9jd27rnpm8ttv>, Anonymize<Ic9nev69d8grv1>, true, never>;
        /**
         * Item attribute approvals.
         */
        ItemAttributesApprovalsOf: StorageDescriptor<Anonymize<I9jd27rnpm8ttv>, Anonymize<Ia2lhg7l2hilo3>, false, never>;
        /**
         * Stores the `CollectionId` that is going to be used for the next collection.
         * This gets incremented whenever a new collection is created.
         */
        NextCollectionId: StorageDescriptor<[], number, true, never>;
        /**
         * Handles all the pending swaps.
         */
        PendingSwapOf: StorageDescriptor<Anonymize<I9jd27rnpm8ttv>, Anonymize<Idac0t49lnd4ls>, true, never>;
        /**
         * Config of a collection.
         */
        CollectionConfigOf: StorageDescriptor<[Key: number], Anonymize<I72ndo6phms8ik>, true, never>;
        /**
         * Config of an item.
         */
        ItemConfigOf: StorageDescriptor<Anonymize<I9jd27rnpm8ttv>, bigint, true, never>;
    };
    NftFractionalization: {
        /**
         * Keeps track of the corresponding NFT ID, asset ID and amount minted.
         */
        NftToAsset: StorageDescriptor<[Key: Anonymize<I9jd27rnpm8ttv>], Anonymize<I1b2ckfeib3nig>, true, never>;
    };
    Assets: {
        /**
         * Details of an asset.
         */
        Asset: StorageDescriptor<[Key: number], Anonymize<I3qklfjubrljqh>, true, never>;
        /**
         * The holdings of a specific account for a specific asset.
         */
        Account: StorageDescriptor<Anonymize<I7svnfko10tq2e>, Anonymize<Iag3f1hum3p4c8>, true, never>;
        /**
         * Approved balance transfers. First balance is the amount approved for transfer. Second
         * is the amount of `T::Currency` reserved for storing this.
         * First key is the asset ID, second key is the owner and third key is the delegate.
         */
        Approvals: StorageDescriptor<Anonymize<I2brm5b9jij1st>, Anonymize<I4s6jkha20aoh0>, true, never>;
        /**
         * Metadata of an asset.
         */
        Metadata: StorageDescriptor<[Key: number], Anonymize<I78s05f59eoi8b>, false, never>;
        /**
         * The asset ID enforced for the next asset creation, if any present. Otherwise, this storage
         * item has no effect.
         *
         * This can be useful for setting up constraints for IDs of the new assets. For example, by
         * providing an initial [`NextAssetId`] and using the [`crate::AutoIncAssetId`] callback, an
         * auto-increment model can be applied to all new asset IDs.
         *
         * The initial next asset ID can be set using the [`GenesisConfig`] or the
         * [SetNextAssetId](`migration::next_asset_id::SetNextAssetId`) migration.
         */
        NextAssetId: StorageDescriptor<[], number, true, never>;
    };
    Revive: {
        /**
         * A mapping from a contract's code hash to its code.
         */
        PristineCode: StorageDescriptor<[Key: FixedSizeBinary<32>], Binary, true, never>;
        /**
         * A mapping from a contract's code hash to its code info.
         */
        CodeInfoOf: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<Idtkgtc4to05ia>, true, never>;
        /**
         * The code associated with a given account.
         */
        ContractInfoOf: StorageDescriptor<[Key: FixedSizeBinary<20>], Anonymize<I5t5eoogd7ekut>, true, never>;
        /**
         * The immutable data associated with a given account.
         */
        ImmutableDataOf: StorageDescriptor<[Key: FixedSizeBinary<20>], Binary, true, never>;
        /**
         * Evicted contracts that await child trie deletion.
         *
         * Child trie deletion is a heavy operation depending on the amount of storage items
         * stored in said trie. Therefore this operation is performed lazily in `on_idle`.
         */
        DeletionQueue: StorageDescriptor<[Key: number], Binary, true, never>;
        /**
         * A pair of monotonic counters used to track the latest contract marked for deletion
         * and the latest deleted contract in queue.
         */
        DeletionQueueCounter: StorageDescriptor<[], Anonymize<I8t4pajubp34g3>, false, never>;
        /**
         * Map a Ethereum address to its original `AccountId32`.
         *
         * When deriving a `H160` from an `AccountId32` we use a hash function. In order to
         * reconstruct the original account we need to store the reverse mapping here.
         * Register your `AccountId32` using [`Pallet::map_account`] in order to
         * use it with this pallet.
         */
        OriginalAccount: StorageDescriptor<[Key: FixedSizeBinary<20>], SS58String, true, never>;
    };
    Messaging: {
        /**
        
         */
        Messages: StorageDescriptor<Anonymize<I95l2k9b1re95f>, Anonymize<Ib1ql4t5slo00r>, true, never>;
        /**
        
         */
        IsmpRequests: StorageDescriptor<[Key: FixedSizeBinary<32>], Anonymize<I95l2k9b1re95f>, true, never>;
        /**
        
         */
        XcmQueries: StorageDescriptor<[Key: bigint], Anonymize<I95l2k9b1re95f>, true, never>;
    };
};
type ICalls = {
    System: {
        /**
         * Make some on-chain remark.
         *
         * Can be executed by every `origin`.
         */
        remark: TxDescriptor<Anonymize<I8ofcg5rbj0g2c>>;
        /**
         * Set the number of pages in the WebAssembly environment's heap.
         */
        set_heap_pages: TxDescriptor<Anonymize<I4adgbll7gku4i>>;
        /**
         * Set the new runtime code.
         */
        set_code: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
        /**
         * Set the new runtime code without doing any checks of the given `code`.
         *
         * Note that runtime upgrades will not run if this is called with a not-increasing spec
         * version!
         */
        set_code_without_checks: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
        /**
         * Set some items of storage.
         */
        set_storage: TxDescriptor<Anonymize<I9pj91mj79qekl>>;
        /**
         * Kill some items from storage.
         */
        kill_storage: TxDescriptor<Anonymize<I39uah9nss64h9>>;
        /**
         * Kill all storage items with a key that starts with the given prefix.
         *
         * **NOTE:** We rely on the Root origin to provide us the number of subkeys under
         * the prefix we are removing to accurately calculate the weight of this function.
         */
        kill_prefix: TxDescriptor<Anonymize<Ik64dknsq7k08>>;
        /**
         * Make some on-chain remark and emit event.
         */
        remark_with_event: TxDescriptor<Anonymize<I8ofcg5rbj0g2c>>;
        /**
         * Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
         * later.
         *
         * This call requires Root origin.
         */
        authorize_upgrade: TxDescriptor<Anonymize<Ib51vk42m1po4n>>;
        /**
         * Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
         * later.
         *
         * WARNING: This authorizes an upgrade that will take place without any safety checks, for
         * example that the spec name remains the same and that the version number increases. Not
         * recommended for normal use. Use `authorize_upgrade` instead.
         *
         * This call requires Root origin.
         */
        authorize_upgrade_without_checks: TxDescriptor<Anonymize<Ib51vk42m1po4n>>;
        /**
         * Provide the preimage (runtime binary) `code` for an upgrade that has been authorized.
         *
         * If the authorization required a version check, this call will ensure the spec name
         * remains unchanged and that the spec version has increased.
         *
         * Depending on the runtime's `OnSetCode` configuration, this function may directly apply
         * the new `code` in the same block or attempt to schedule the upgrade.
         *
         * All origins are allowed.
         */
        apply_authorized_upgrade: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
    };
    ParachainSystem: {
        /**
         * Set the current validation data.
         *
         * This should be invoked exactly once per block. It will panic at the finalization
         * phase if the call was not invoked.
         *
         * The dispatch origin for this call must be `Inherent`
         *
         * As a side effect, this function upgrades the current validation function
         * if the appropriate time has come.
         */
        set_validation_data: TxDescriptor<Anonymize<I60v7bikk54tpu>>;
        /**
        
         */
        sudo_send_upward_message: TxDescriptor<Anonymize<Ifpj261e8s63m3>>;
    };
    Timestamp: {
        /**
         * Set the current time.
         *
         * This call should be invoked exactly once per block. It will panic at the finalization
         * phase, if this call hasn't been invoked by that time.
         *
         * The timestamp should be greater than the previous one by the amount specified by
         * [`Config::MinimumPeriod`].
         *
         * The dispatch origin for this call must be _None_.
         *
         * This dispatch class is _Mandatory_ to ensure it gets executed in the block. Be aware
         * that changing the complexity of this call could result exhausting the resources in a
         * block to execute any other calls.
         *
         * ## Complexity
         * - `O(1)` (Note that implementations of `OnTimestampSet` must also be `O(1)`)
         * - 1 storage read and 1 storage mutation (codec `O(1)` because of `DidUpdate::take` in
         * `on_finalize`)
         * - 1 event handler `on_timestamp_set`. Must be `O(1)`.
         */
        set: TxDescriptor<Anonymize<Idcr6u6361oad9>>;
    };
    MultiBlockMigrations: {
        /**
         * Allows root to set a cursor to forcefully start, stop or forward the migration process.
         *
         * Should normally not be needed and is only in place as emergency measure. Note that
         * restarting the migration process in this manner will not call the
         * [`MigrationStatusHandler::started`] hook or emit an `UpgradeStarted` event.
         */
        force_set_cursor: TxDescriptor<Anonymize<Ibou4u1engb441>>;
        /**
         * Allows root to set an active cursor to forcefully start/forward the migration process.
         *
         * This is an edge-case version of [`Self::force_set_cursor`] that allows to set the
         * `started_at` value to the next block number. Otherwise this would not be possible, since
         * `force_set_cursor` takes an absolute block number. Setting `started_at` to `None`
         * indicates that the current block number plus one should be used.
         */
        force_set_active_cursor: TxDescriptor<Anonymize<Id6nbvqoqdj4o2>>;
        /**
         * Forces the onboarding of the migrations.
         *
         * This process happens automatically on a runtime upgrade. It is in place as an emergency
         * measurement. The cursor needs to be `None` for this to succeed.
         */
        force_onboard_mbms: TxDescriptor<undefined>;
        /**
         * Clears the `Historic` set.
         *
         * `map_cursor` must be set to the last value that was returned by the
         * `HistoricCleared` event. The first time `None` can be used. `limit` must be chosen in a
         * way that will result in a sensible weight.
         */
        clear_historic: TxDescriptor<Anonymize<I95iqep3b8snn9>>;
    };
    Balances: {
        /**
         * Transfer some liquid free balance to another account.
         *
         * `transfer_allow_death` will set the `FreeBalance` of the sender and receiver.
         * If the sender's account is below the existential deposit as a result
         * of the transfer, the account will be reaped.
         *
         * The dispatch origin for this call must be `Signed` by the transactor.
         */
        transfer_allow_death: TxDescriptor<Anonymize<I4ktuaksf5i1gk>>;
        /**
         * Exactly as `transfer_allow_death`, except the origin must be root and the source account
         * may be specified.
         */
        force_transfer: TxDescriptor<Anonymize<I9bqtpv2ii35mp>>;
        /**
         * Same as the [`transfer_allow_death`] call, but with a check that the transfer will not
         * kill the origin account.
         *
         * 99% of the time you want [`transfer_allow_death`] instead.
         *
         * [`transfer_allow_death`]: struct.Pallet.html#method.transfer
         */
        transfer_keep_alive: TxDescriptor<Anonymize<I4ktuaksf5i1gk>>;
        /**
         * Transfer the entire transferable balance from the caller account.
         *
         * NOTE: This function only attempts to transfer _transferable_ balances. This means that
         * any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
         * transferred by this function. To ensure that this function results in a killed account,
         * you might need to prepare the account by removing any reference counters, storage
         * deposits, etc...
         *
         * The dispatch origin of this call must be Signed.
         *
         * - `dest`: The recipient of the transfer.
         * - `keep_alive`: A boolean to determine if the `transfer_all` operation should send all
         * of the funds the account has, causing the sender account to be killed (false), or
         * transfer everything except at least the existential deposit, which will guarantee to
         * keep the sender account alive (true).
         */
        transfer_all: TxDescriptor<Anonymize<I9j7pagd6d4bda>>;
        /**
         * Unreserve some balance from a user by force.
         *
         * Can only be called by ROOT.
         */
        force_unreserve: TxDescriptor<Anonymize<I2h9pmio37r7fb>>;
        /**
         * Upgrade a specified account.
         *
         * - `origin`: Must be `Signed`.
         * - `who`: The account to be upgraded.
         *
         * This will waive the transaction fee if at least all but 10% of the accounts needed to
         * be upgraded. (We let some not have to be upgraded just in order to allow for the
         * possibility of churn).
         */
        upgrade_accounts: TxDescriptor<Anonymize<Ibmr18suc9ikh9>>;
        /**
         * Set the regular balance of a given account.
         *
         * The dispatch origin for this call is `root`.
         */
        force_set_balance: TxDescriptor<Anonymize<I9iq22t0burs89>>;
        /**
         * Adjust the total issuance in a saturating way.
         *
         * Can only be called by root and always needs a positive `delta`.
         *
         * # Example
         */
        force_adjust_total_issuance: TxDescriptor<Anonymize<I5u8olqbbvfnvf>>;
        /**
         * Burn the specified liquid free balance from the origin account.
         *
         * If the origin's account ends up below the existential deposit as a result
         * of the burn and `keep_alive` is false, the account will be reaped.
         *
         * Unlike sending funds to a _burn_ address, which merely makes the funds inaccessible,
         * this `burn` operation will reduce total issuance by the amount _burned_.
         */
        burn: TxDescriptor<Anonymize<I5utcetro501ir>>;
    };
    Treasury: {
        /**
         * Propose and approve a spend of treasury funds.
         *
         * ## Dispatch Origin
         *
         * Must be [`Config::SpendOrigin`] with the `Success` value being at least `amount`.
         *
         * ### Details
         * NOTE: For record-keeping purposes, the proposer is deemed to be equivalent to the
         * beneficiary.
         *
         * ### Parameters
         * - `amount`: The amount to be transferred from the treasury to the `beneficiary`.
         * - `beneficiary`: The destination account for the transfer.
         *
         * ## Events
         *
         * Emits [`Event::SpendApproved`] if successful.
         */
        spend_local: TxDescriptor<Anonymize<Icnrv1mfbd3in1>>;
        /**
         * Force a previously approved proposal to be removed from the approval queue.
         *
         * ## Dispatch Origin
         *
         * Must be [`Config::RejectOrigin`].
         *
         * ## Details
         *
         * The original deposit will no longer be returned.
         *
         * ### Parameters
         * - `proposal_id`: The index of a proposal
         *
         * ### Complexity
         * - O(A) where `A` is the number of approvals
         *
         * ### Errors
         * - [`Error::ProposalNotApproved`]: The `proposal_id` supplied was not found in the
         * approval queue, i.e., the proposal has not been approved. This could also mean the
         * proposal does not exist altogether, thus there is no way it would have been approved
         * in the first place.
         */
        remove_approval: TxDescriptor<Anonymize<Icm9m0qeemu66d>>;
        /**
         * Propose and approve a spend of treasury funds.
         *
         * ## Dispatch Origin
         *
         * Must be [`Config::SpendOrigin`] with the `Success` value being at least
         * `amount` of `asset_kind` in the native asset. The amount of `asset_kind` is converted
         * for assertion using the [`Config::BalanceConverter`].
         *
         * ## Details
         *
         * Create an approved spend for transferring a specific `amount` of `asset_kind` to a
         * designated beneficiary. The spend must be claimed using the `payout` dispatchable within
         * the [`Config::PayoutPeriod`].
         *
         * ### Parameters
         * - `asset_kind`: An indicator of the specific asset class to be spent.
         * - `amount`: The amount to be transferred from the treasury to the `beneficiary`.
         * - `beneficiary`: The beneficiary of the spend.
         * - `valid_from`: The block number from which the spend can be claimed. It can refer to
         * the past if the resulting spend has not yet expired according to the
         * [`Config::PayoutPeriod`]. If `None`, the spend can be claimed immediately after
         * approval.
         *
         * ## Events
         *
         * Emits [`Event::AssetSpendApproved`] if successful.
         */
        spend: TxDescriptor<Anonymize<I6qq5nnbjegi8u>>;
        /**
         * Claim a spend.
         *
         * ## Dispatch Origin
         *
         * Must be signed
         *
         * ## Details
         *
         * Spends must be claimed within some temporal bounds. A spend may be claimed within one
         * [`Config::PayoutPeriod`] from the `valid_from` block.
         * In case of a payout failure, the spend status must be updated with the `check_status`
         * dispatchable before retrying with the current function.
         *
         * ### Parameters
         * - `index`: The spend index.
         *
         * ## Events
         *
         * Emits [`Event::Paid`] if successful.
         */
        payout: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
        /**
         * Check the status of the spend and remove it from the storage if processed.
         *
         * ## Dispatch Origin
         *
         * Must be signed.
         *
         * ## Details
         *
         * The status check is a prerequisite for retrying a failed payout.
         * If a spend has either succeeded or expired, it is removed from the storage by this
         * function. In such instances, transaction fees are refunded.
         *
         * ### Parameters
         * - `index`: The spend index.
         *
         * ## Events
         *
         * Emits [`Event::PaymentFailed`] if the spend payout has failed.
         * Emits [`Event::SpendProcessed`] if the spend payout has succeed.
         */
        check_status: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
        /**
         * Void previously approved spend.
         *
         * ## Dispatch Origin
         *
         * Must be [`Config::RejectOrigin`].
         *
         * ## Details
         *
         * A spend void is only possible if the payout has not been attempted yet.
         *
         * ### Parameters
         * - `index`: The spend index.
         *
         * ## Events
         *
         * Emits [`Event::AssetSpendVoided`] if successful.
         */
        void_spend: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    };
    Sudo: {
        /**
         * Authenticates the sudo key and dispatches a function call with `Root` origin.
         */
        sudo: TxDescriptor<Anonymize<I65k89p01c7fcj>>;
        /**
         * Authenticates the sudo key and dispatches a function call with `Root` origin.
         * This function does not check the weight of the call, and instead allows the
         * Sudo user to specify the weight of the call.
         *
         * The dispatch origin for this call must be _Signed_.
         */
        sudo_unchecked_weight: TxDescriptor<Anonymize<Ib4q9jf1uph4bc>>;
        /**
         * Authenticates the current sudo key and sets the given AccountId (`new`) as the new sudo
         * key.
         */
        set_key: TxDescriptor<Anonymize<I8k3rnvpeeh4hv>>;
        /**
         * Authenticates the sudo key and dispatches a function call with `Signed` origin from
         * a given account.
         *
         * The dispatch origin for this call must be _Signed_.
         */
        sudo_as: TxDescriptor<Anonymize<Ib77pq85cp10ei>>;
        /**
         * Permanently removes the sudo key.
         *
         * **This cannot be un-done.**
         */
        remove_key: TxDescriptor<undefined>;
    };
    Council: {
        /**
         * Set the collective's membership.
         *
         * - `new_members`: The new member list. Be nice to the chain and provide it sorted.
         * - `prime`: The prime member whose vote sets the default.
         * - `old_count`: The upper bound for the previous number of members in storage. Used for
         * weight estimation.
         *
         * The dispatch of this call must be `SetMembersOrigin`.
         *
         * NOTE: Does not enforce the expected `MaxMembers` limit on the amount of members, but
         * the weight estimations rely on it to estimate dispatchable weight.
         *
         * # WARNING:
         *
         * The `pallet-collective` can also be managed by logic outside of the pallet through the
         * implementation of the trait [`ChangeMembers`].
         * Any call to `set_members` must be careful that the member set doesn't get out of sync
         * with other logic managing the member set.
         *
         * ## Complexity:
         * - `O(MP + N)` where:
         * - `M` old-members-count (code- and governance-bounded)
         * - `N` new-members-count (code- and governance-bounded)
         * - `P` proposals-count (code-bounded)
         */
        set_members: TxDescriptor<Anonymize<I38jfk5li8iang>>;
        /**
         * Dispatch a proposal from a member using the `Member` origin.
         *
         * Origin must be a member of the collective.
         *
         * ## Complexity:
         * - `O(B + M + P)` where:
         * - `B` is `proposal` size in bytes (length-fee-bounded)
         * - `M` members-count (code-bounded)
         * - `P` complexity of dispatching `proposal`
         */
        execute: TxDescriptor<Anonymize<Iacclckeoc6dqp>>;
        /**
         * Add a new proposal to either be voted on or executed directly.
         *
         * Requires the sender to be member.
         *
         * `threshold` determines whether `proposal` is executed directly (`threshold < 2`)
         * or put up for voting.
         *
         * ## Complexity
         * - `O(B + M + P1)` or `O(B + M + P2)` where:
         * - `B` is `proposal` size in bytes (length-fee-bounded)
         * - `M` is members-count (code- and governance-bounded)
         * - branching is influenced by `threshold` where:
         * - `P1` is proposal execution complexity (`threshold < 2`)
         * - `P2` is proposals-count (code-bounded) (`threshold >= 2`)
         */
        propose: TxDescriptor<Anonymize<I8p0oc5o4vjmvt>>;
        /**
         * Add an aye or nay vote for the sender to the given proposal.
         *
         * Requires the sender to be a member.
         *
         * Transaction fees will be waived if the member is voting on any particular proposal
         * for the first time and the call is successful. Subsequent vote changes will charge a
         * fee.
         * ## Complexity
         * - `O(M)` where `M` is members-count (code- and governance-bounded)
         */
        vote: TxDescriptor<Anonymize<I2dtrijkm5601t>>;
        /**
         * Disapprove a proposal, close, and remove it from the system, regardless of its current
         * state.
         *
         * Must be called by the Root origin.
         *
         * Parameters:
         * * `proposal_hash`: The hash of the proposal that should be disapproved.
         *
         * ## Complexity
         * O(P) where P is the number of max proposals
         */
        disapprove_proposal: TxDescriptor<Anonymize<I2ev73t79f46tb>>;
        /**
         * Close a vote that is either approved, disapproved or whose voting period has ended.
         *
         * May be called by any signed account in order to finish voting and close the proposal.
         *
         * If called before the end of the voting period it will only close the vote if it is
         * has enough votes to be approved or disapproved.
         *
         * If called after the end of the voting period abstentions are counted as rejections
         * unless there is a prime member set and the prime member cast an approval.
         *
         * If the close operation completes successfully with disapproval, the transaction fee will
         * be waived. Otherwise execution of the approved operation will be charged to the caller.
         *
         * + `proposal_weight_bound`: The maximum amount of weight consumed by executing the closed
         * proposal.
         * + `length_bound`: The upper bound for the length of the proposal in storage. Checked via
         * `storage::read` so it is `size_of::<u32>() == 4` larger than the pure length.
         *
         * ## Complexity
         * - `O(B + M + P1 + P2)` where:
         * - `B` is `proposal` size in bytes (length-fee-bounded)
         * - `M` is members-count (code- and governance-bounded)
         * - `P1` is the complexity of `proposal` preimage.
         * - `P2` is proposal-count (code-bounded)
         */
        close: TxDescriptor<Anonymize<Ib2obgji960euh>>;
        /**
         * Disapprove the proposal and burn the cost held for storing this proposal.
         *
         * Parameters:
         * - `origin`: must be the `KillOrigin`.
         * - `proposal_hash`: The hash of the proposal that should be killed.
         *
         * Emits `Killed` and `ProposalCostBurned` if any cost was held for a given proposal.
         */
        kill: TxDescriptor<Anonymize<I2ev73t79f46tb>>;
        /**
         * Release the cost held for storing a proposal once the given proposal is completed.
         *
         * If there is no associated cost for the given proposal, this call will have no effect.
         *
         * Parameters:
         * - `origin`: must be `Signed` or `Root`.
         * - `proposal_hash`: The hash of the proposal.
         *
         * Emits `ProposalCostReleased` if any cost held for a given proposal.
         */
        release_proposal_cost: TxDescriptor<Anonymize<I2ev73t79f46tb>>;
    };
    Motion: {
        /**
         * Ensures the simple majority is met and dispatches a call with `Root` origin.
         *
         * # <weight>
         * - O(1).
         * - Limited storage reads.
         * - One DB write (event).
         * - Weight of derivative `call` execution.
         * # </weight>
         */
        simple_majority: TxDescriptor<Anonymize<I65k89p01c7fcj>>;
        /**
         * Ensures the super majority is met and dispatches a call with `Root` origin.
         *
         * # <weight>
         * - O(1).
         * - Limited storage reads.
         * - One DB write (event).
         * - Weight of derivative `call` execution.
         * # </weight>
         */
        super_majority: TxDescriptor<Anonymize<I65k89p01c7fcj>>;
        /**
         * Ensures unanimous voting is met and dispatches a call with `Root` origin.
         *
         * # <weight>
         * - O(1).
         * - Limited storage reads.
         * - One DB write (event).
         * - Weight of derivative `call` execution.
         * # </weight>
         */
        unanimous: TxDescriptor<Anonymize<I65k89p01c7fcj>>;
    };
    CollatorSelection: {
        /**
         * Set the list of invulnerable (fixed) collators. These collators must do some
         * preparation, namely to have registered session keys.
         *
         * The call will remove any accounts that have not registered keys from the set. That is,
         * it is non-atomic; the caller accepts all `AccountId`s passed in `new` _individually_ as
         * acceptable Invulnerables, and is not proposing a _set_ of new Invulnerables.
         *
         * This call does not maintain mutual exclusivity of `Invulnerables` and `Candidates`. It
         * is recommended to use a batch of `add_invulnerable` and `remove_invulnerable` instead. A
         * `batch_all` can also be used to enforce atomicity. If any candidates are included in
         * `new`, they should be removed with `remove_invulnerable_candidate` after execution.
         *
         * Must be called by the `UpdateOrigin`.
         */
        set_invulnerables: TxDescriptor<Anonymize<Ifccifqltb5obi>>;
        /**
         * Set the ideal number of non-invulnerable collators. If lowering this number, then the
         * number of running collators could be higher than this figure. Aside from that edge case,
         * there should be no other way to have more candidates than the desired number.
         *
         * The origin for this call must be the `UpdateOrigin`.
         */
        set_desired_candidates: TxDescriptor<Anonymize<Iadtsfv699cq8b>>;
        /**
         * Set the candidacy bond amount.
         *
         * If the candidacy bond is increased by this call, all current candidates which have a
         * deposit lower than the new bond will be kicked from the list and get their deposits
         * back.
         *
         * The origin for this call must be the `UpdateOrigin`.
         */
        set_candidacy_bond: TxDescriptor<Anonymize<Ialpmgmhr3gk5r>>;
        /**
         * Register this account as a collator candidate. The account must (a) already have
         * registered session keys and (b) be able to reserve the `CandidacyBond`.
         *
         * This call is not available to `Invulnerable` collators.
         */
        register_as_candidate: TxDescriptor<undefined>;
        /**
         * Deregister `origin` as a collator candidate. Note that the collator can only leave on
         * session change. The `CandidacyBond` will be unreserved immediately.
         *
         * This call will fail if the total number of candidates would drop below
         * `MinEligibleCollators`.
         */
        leave_intent: TxDescriptor<undefined>;
        /**
         * Add a new account `who` to the list of `Invulnerables` collators. `who` must have
         * registered session keys. If `who` is a candidate, they will be removed.
         *
         * The origin for this call must be the `UpdateOrigin`.
         */
        add_invulnerable: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
        /**
         * Remove an account `who` from the list of `Invulnerables` collators. `Invulnerables` must
         * be sorted.
         *
         * The origin for this call must be the `UpdateOrigin`.
         */
        remove_invulnerable: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
        /**
         * Update the candidacy bond of collator candidate `origin` to a new amount `new_deposit`.
         *
         * Setting a `new_deposit` that is lower than the current deposit while `origin` is
         * occupying a top-`DesiredCandidates` slot is not allowed.
         *
         * This call will fail if `origin` is not a collator candidate, the updated bond is lower
         * than the minimum candidacy bond, and/or the amount cannot be reserved.
         */
        update_bond: TxDescriptor<Anonymize<I3sdol54kg5jaq>>;
        /**
         * The caller `origin` replaces a candidate `target` in the collator candidate list by
         * reserving `deposit`. The amount `deposit` reserved by the caller must be greater than
         * the existing bond of the target it is trying to replace.
         *
         * This call will fail if the caller is already a collator candidate or invulnerable, the
         * caller does not have registered session keys, the target is not a collator candidate,
         * and/or the `deposit` amount cannot be reserved.
         */
        take_candidate_slot: TxDescriptor<Anonymize<I8fougodaj6di6>>;
    };
    Session: {
        /**
         * Sets the session key(s) of the function caller to `keys`.
         * Allows an account to set its session key prior to becoming a validator.
         * This doesn't take effect until the next session.
         *
         * The dispatch origin of this function must be signed.
         *
         * ## Complexity
         * - `O(1)`. Actual cost depends on the number of length of `T::Keys::key_ids()` which is
         * fixed.
         */
        set_keys: TxDescriptor<Anonymize<I81vt5eq60l4b6>>;
        /**
         * Removes any session key(s) of the function caller.
         *
         * This doesn't take effect until the next session.
         *
         * The dispatch origin of this function must be Signed and the account must be either be
         * convertible to a validator ID using the chain's typical addressing system (this usually
         * means being a controller account) or directly convertible into a validator ID (which
         * usually means being a stash account).
         *
         * ## Complexity
         * - `O(1)` in number of key types. Actual cost depends on the number of length of
         * `T::Keys::key_ids()` which is fixed.
         */
        purge_keys: TxDescriptor<undefined>;
    };
    Scheduler: {
        /**
         * Anonymously schedule a task.
         */
        schedule: TxDescriptor<Anonymize<Icdon4tuliqbtj>>;
        /**
         * Cancel an anonymously scheduled task.
         */
        cancel: TxDescriptor<Anonymize<I5n4sebgkfr760>>;
        /**
         * Schedule a named task.
         */
        schedule_named: TxDescriptor<Anonymize<I65763ebeio6mf>>;
        /**
         * Cancel a named scheduled task.
         */
        cancel_named: TxDescriptor<Anonymize<Ifs1i5fk9cqvr6>>;
        /**
         * Anonymously schedule a task after a delay.
         */
        schedule_after: TxDescriptor<Anonymize<Id54so1b2erhs0>>;
        /**
         * Schedule a named task after a delay.
         */
        schedule_named_after: TxDescriptor<Anonymize<Iblrelnrotlf1f>>;
        /**
         * Set a retry configuration for a task so that, in case its scheduled run fails, it will
         * be retried after `period` blocks, for a total amount of `retries` retries or until it
         * succeeds.
         *
         * Tasks which need to be scheduled for a retry are still subject to weight metering and
         * agenda space, same as a regular task. If a periodic task fails, it will be scheduled
         * normally while the task is retrying.
         *
         * Tasks scheduled as a result of a retry for a periodic task are unnamed, non-periodic
         * clones of the original task. Their retry configuration will be derived from the
         * original task's configuration, but will have a lower value for `remaining` than the
         * original `total_retries`.
         */
        set_retry: TxDescriptor<Anonymize<Ieg3fd8p4pkt10>>;
        /**
         * Set a retry configuration for a named task so that, in case its scheduled run fails, it
         * will be retried after `period` blocks, for a total amount of `retries` retries or until
         * it succeeds.
         *
         * Tasks which need to be scheduled for a retry are still subject to weight metering and
         * agenda space, same as a regular task. If a periodic task fails, it will be scheduled
         * normally while the task is retrying.
         *
         * Tasks scheduled as a result of a retry for a periodic task are unnamed, non-periodic
         * clones of the original task. Their retry configuration will be derived from the
         * original task's configuration, but will have a lower value for `remaining` than the
         * original `total_retries`.
         */
        set_retry_named: TxDescriptor<Anonymize<I8kg5ll427kfqq>>;
        /**
         * Removes the retry configuration of a task.
         */
        cancel_retry: TxDescriptor<Anonymize<I467333262q1l9>>;
        /**
         * Cancel the retry configuration of a named task.
         */
        cancel_retry_named: TxDescriptor<Anonymize<Ifs1i5fk9cqvr6>>;
    };
    Preimage: {
        /**
         * Register a preimage on-chain.
         *
         * If the preimage was previously requested, no fees or deposits are taken for providing
         * the preimage. Otherwise, a deposit is taken proportional to the size of the preimage.
         */
        note_preimage: TxDescriptor<Anonymize<I82nfqfkd48n10>>;
        /**
         * Clear an unrequested preimage from the runtime storage.
         *
         * If `len` is provided, then it will be a much cheaper operation.
         *
         * - `hash`: The hash of the preimage to be removed from the store.
         * - `len`: The length of the preimage of `hash`.
         */
        unnote_preimage: TxDescriptor<Anonymize<I1jm8m1rh9e20v>>;
        /**
         * Request a preimage be uploaded to the chain without paying any fees or deposits.
         *
         * If the preimage requests has already been provided on-chain, we unreserve any deposit
         * a user may have paid, and take the control of the preimage out of their hands.
         */
        request_preimage: TxDescriptor<Anonymize<I1jm8m1rh9e20v>>;
        /**
         * Clear a previously made request for a preimage.
         *
         * NOTE: THIS MUST NOT BE CALLED ON `hash` MORE TIMES THAN `request_preimage`.
         */
        unrequest_preimage: TxDescriptor<Anonymize<I1jm8m1rh9e20v>>;
        /**
         * Ensure that the bulk of pre-images is upgraded.
         *
         * The caller pays no fee if at least 90% of pre-images were successfully updated.
         */
        ensure_updated: TxDescriptor<Anonymize<I3o5j3bli1pd8e>>;
    };
    XcmpQueue: {
        /**
         * Suspends all XCM executions for the XCMP queue, regardless of the sender's origin.
         *
         * - `origin`: Must pass `ControllerOrigin`.
         */
        suspend_xcm_execution: TxDescriptor<undefined>;
        /**
         * Resumes all XCM executions for the XCMP queue.
         *
         * Note that this function doesn't change the status of the in/out bound channels.
         *
         * - `origin`: Must pass `ControllerOrigin`.
         */
        resume_xcm_execution: TxDescriptor<undefined>;
        /**
         * Overwrites the number of pages which must be in the queue for the other side to be
         * told to suspend their sending.
         *
         * - `origin`: Must pass `Root`.
         * - `new`: Desired value for `QueueConfigData.suspend_value`
         */
        update_suspend_threshold: TxDescriptor<Anonymize<I3vh014cqgmrfd>>;
        /**
         * Overwrites the number of pages which must be in the queue after which we drop any
         * further messages from the channel.
         *
         * - `origin`: Must pass `Root`.
         * - `new`: Desired value for `QueueConfigData.drop_threshold`
         */
        update_drop_threshold: TxDescriptor<Anonymize<I3vh014cqgmrfd>>;
        /**
         * Overwrites the number of pages which the queue must be reduced to before it signals
         * that message sending may recommence after it has been suspended.
         *
         * - `origin`: Must pass `Root`.
         * - `new`: Desired value for `QueueConfigData.resume_threshold`
         */
        update_resume_threshold: TxDescriptor<Anonymize<I3vh014cqgmrfd>>;
    };
    PolkadotXcm: {
        /**
        
         */
        send: TxDescriptor<Anonymize<Ieh0lckc0vpjc6>>;
        /**
         * Teleport some assets from the local chain to some destination chain.
         *
         * **This function is deprecated: Use `limited_teleport_assets` instead.**
         *
         * Fee payment on the destination side is made from the asset in the `assets` vector of
         * index `fee_asset_item`. The weight limit for fees is not provided and thus is unlimited,
         * with all fees taken as needed from the asset.
         *
         * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
         * - `dest`: Destination context for the assets. Will typically be `[Parent,
         * Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
         * relay to parachain.
         * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
         * generally be an `AccountId32` value.
         * - `assets`: The assets to be withdrawn. This should include the assets used to pay the
         * fee on the `dest` chain.
         * - `fee_asset_item`: The index into `assets` of the item which should be used to pay
         * fees.
         */
        teleport_assets: TxDescriptor<Anonymize<I21jsa919m88fd>>;
        /**
         * Transfer some assets from the local chain to the destination chain through their local,
         * destination or remote reserve.
         *
         * `assets` must have same reserve location and may not be teleportable to `dest`.
         * - `assets` have local reserve: transfer assets to sovereign account of destination
         * chain and forward a notification XCM to `dest` to mint and deposit reserve-based
         * assets to `beneficiary`.
         * - `assets` have destination reserve: burn local assets and forward a notification to
         * `dest` chain to withdraw the reserve assets from this chain's sovereign account and
         * deposit them to `beneficiary`.
         * - `assets` have remote reserve: burn local assets, forward XCM to reserve chain to move
         * reserves from this chain's SA to `dest` chain's SA, and forward another XCM to `dest`
         * to mint and deposit reserve-based assets to `beneficiary`.
         *
         * **This function is deprecated: Use `limited_reserve_transfer_assets` instead.**
         *
         * Fee payment on the destination side is made from the asset in the `assets` vector of
         * index `fee_asset_item`. The weight limit for fees is not provided and thus is unlimited,
         * with all fees taken as needed from the asset.
         *
         * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
         * - `dest`: Destination context for the assets. Will typically be `[Parent,
         * Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
         * relay to parachain.
         * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
         * generally be an `AccountId32` value.
         * - `assets`: The assets to be withdrawn. This should include the assets used to pay the
         * fee on the `dest` (and possibly reserve) chains.
         * - `fee_asset_item`: The index into `assets` of the item which should be used to pay
         * fees.
         */
        reserve_transfer_assets: TxDescriptor<Anonymize<I21jsa919m88fd>>;
        /**
         * Execute an XCM message from a local, signed, origin.
         *
         * An event is deposited indicating whether `msg` could be executed completely or only
         * partially.
         *
         * No more than `max_weight` will be used in its attempted execution. If this is less than
         * the maximum amount of weight that the message could take to be executed, then no
         * execution attempt will be made.
         */
        execute: TxDescriptor<Anonymize<I653g7mv3sqsvk>>;
        /**
         * Extoll that a particular destination can be communicated with through a particular
         * version of XCM.
         *
         * - `origin`: Must be an origin specified by AdminOrigin.
         * - `location`: The destination that is being described.
         * - `xcm_version`: The latest version of XCM that `location` supports.
         */
        force_xcm_version: TxDescriptor<Anonymize<I9kt8c221c83ln>>;
        /**
         * Set a safe XCM version (the version that XCM should be encoded with if the most recent
         * version a destination can accept is unknown).
         *
         * - `origin`: Must be an origin specified by AdminOrigin.
         * - `maybe_xcm_version`: The default XCM encoding version, or `None` to disable.
         */
        force_default_xcm_version: TxDescriptor<Anonymize<Ic76kfh5ebqkpl>>;
        /**
         * Ask a location to notify us regarding their XCM version and any changes to it.
         *
         * - `origin`: Must be an origin specified by AdminOrigin.
         * - `location`: The location to which we should subscribe for XCM version notifications.
         */
        force_subscribe_version_notify: TxDescriptor<Anonymize<Icscpmubum33bq>>;
        /**
         * Require that a particular destination should no longer notify us regarding any XCM
         * version changes.
         *
         * - `origin`: Must be an origin specified by AdminOrigin.
         * - `location`: The location to which we are currently subscribed for XCM version
         * notifications which we no longer desire.
         */
        force_unsubscribe_version_notify: TxDescriptor<Anonymize<Icscpmubum33bq>>;
        /**
         * Transfer some assets from the local chain to the destination chain through their local,
         * destination or remote reserve.
         *
         * `assets` must have same reserve location and may not be teleportable to `dest`.
         * - `assets` have local reserve: transfer assets to sovereign account of destination
         * chain and forward a notification XCM to `dest` to mint and deposit reserve-based
         * assets to `beneficiary`.
         * - `assets` have destination reserve: burn local assets and forward a notification to
         * `dest` chain to withdraw the reserve assets from this chain's sovereign account and
         * deposit them to `beneficiary`.
         * - `assets` have remote reserve: burn local assets, forward XCM to reserve chain to move
         * reserves from this chain's SA to `dest` chain's SA, and forward another XCM to `dest`
         * to mint and deposit reserve-based assets to `beneficiary`.
         *
         * Fee payment on the destination side is made from the asset in the `assets` vector of
         * index `fee_asset_item`, up to enough to pay for `weight_limit` of weight. If more weight
         * is needed than `weight_limit`, then the operation will fail and the sent assets may be
         * at risk.
         *
         * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
         * - `dest`: Destination context for the assets. Will typically be `[Parent,
         * Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
         * relay to parachain.
         * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
         * generally be an `AccountId32` value.
         * - `assets`: The assets to be withdrawn. This should include the assets used to pay the
         * fee on the `dest` (and possibly reserve) chains.
         * - `fee_asset_item`: The index into `assets` of the item which should be used to pay
         * fees.
         * - `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
         */
        limited_reserve_transfer_assets: TxDescriptor<Anonymize<I21d2olof7eb60>>;
        /**
         * Teleport some assets from the local chain to some destination chain.
         *
         * Fee payment on the destination side is made from the asset in the `assets` vector of
         * index `fee_asset_item`, up to enough to pay for `weight_limit` of weight. If more weight
         * is needed than `weight_limit`, then the operation will fail and the sent assets may be
         * at risk.
         *
         * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
         * - `dest`: Destination context for the assets. Will typically be `[Parent,
         * Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
         * relay to parachain.
         * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
         * generally be an `AccountId32` value.
         * - `assets`: The assets to be withdrawn. This should include the assets used to pay the
         * fee on the `dest` chain.
         * - `fee_asset_item`: The index into `assets` of the item which should be used to pay
         * fees.
         * - `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
         */
        limited_teleport_assets: TxDescriptor<Anonymize<I21d2olof7eb60>>;
        /**
         * Set or unset the global suspension state of the XCM executor.
         *
         * - `origin`: Must be an origin specified by AdminOrigin.
         * - `suspended`: `true` to suspend, `false` to resume.
         */
        force_suspension: TxDescriptor<Anonymize<Ibgm4rnf22lal1>>;
        /**
         * Transfer some assets from the local chain to the destination chain through their local,
         * destination or remote reserve, or through teleports.
         *
         * Fee payment on the destination side is made from the asset in the `assets` vector of
         * index `fee_asset_item` (hence referred to as `fees`), up to enough to pay for
         * `weight_limit` of weight. If more weight is needed than `weight_limit`, then the
         * operation will fail and the sent assets may be at risk.
         *
         * `assets` (excluding `fees`) must have same reserve location or otherwise be teleportable
         * to `dest`, no limitations imposed on `fees`.
         * - for local reserve: transfer assets to sovereign account of destination chain and
         * forward a notification XCM to `dest` to mint and deposit reserve-based assets to
         * `beneficiary`.
         * - for destination reserve: burn local assets and forward a notification to `dest` chain
         * to withdraw the reserve assets from this chain's sovereign account and deposit them
         * to `beneficiary`.
         * - for remote reserve: burn local assets, forward XCM to reserve chain to move reserves
         * from this chain's SA to `dest` chain's SA, and forward another XCM to `dest` to mint
         * and deposit reserve-based assets to `beneficiary`.
         * - for teleports: burn local assets and forward XCM to `dest` chain to mint/teleport
         * assets and deposit them to `beneficiary`.
         *
         * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
         * - `dest`: Destination context for the assets. Will typically be `X2(Parent,
         * Parachain(..))` to send from parachain to parachain, or `X1(Parachain(..))` to send
         * from relay to parachain.
         * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
         * generally be an `AccountId32` value.
         * - `assets`: The assets to be withdrawn. This should include the assets used to pay the
         * fee on the `dest` (and possibly reserve) chains.
         * - `fee_asset_item`: The index into `assets` of the item which should be used to pay
         * fees.
         * - `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
         */
        transfer_assets: TxDescriptor<Anonymize<I21d2olof7eb60>>;
        /**
         * Claims assets trapped on this pallet because of leftover assets during XCM execution.
         *
         * - `origin`: Anyone can call this extrinsic.
         * - `assets`: The exact assets that were trapped. Use the version to specify what version
         * was the latest when they were trapped.
         * - `beneficiary`: The location/account where the claimed assets will be deposited.
         */
        claim_assets: TxDescriptor<Anonymize<Ie68np0vpihith>>;
        /**
         * Transfer assets from the local chain to the destination chain using explicit transfer
         * types for assets and fees.
         *
         * `assets` must have same reserve location or may be teleportable to `dest`. Caller must
         * provide the `assets_transfer_type` to be used for `assets`:
         * - `TransferType::LocalReserve`: transfer assets to sovereign account of destination
         * chain and forward a notification XCM to `dest` to mint and deposit reserve-based
         * assets to `beneficiary`.
         * - `TransferType::DestinationReserve`: burn local assets and forward a notification to
         * `dest` chain to withdraw the reserve assets from this chain's sovereign account and
         * deposit them to `beneficiary`.
         * - `TransferType::RemoteReserve(reserve)`: burn local assets, forward XCM to `reserve`
         * chain to move reserves from this chain's SA to `dest` chain's SA, and forward another
         * XCM to `dest` to mint and deposit reserve-based assets to `beneficiary`. Typically
         * the remote `reserve` is Asset Hub.
         * - `TransferType::Teleport`: burn local assets and forward XCM to `dest` chain to
         * mint/teleport assets and deposit them to `beneficiary`.
         *
         * On the destination chain, as well as any intermediary hops, `BuyExecution` is used to
         * buy execution using transferred `assets` identified by `remote_fees_id`.
         * Make sure enough of the specified `remote_fees_id` asset is included in the given list
         * of `assets`. `remote_fees_id` should be enough to pay for `weight_limit`. If more weight
         * is needed than `weight_limit`, then the operation will fail and the sent assets may be
         * at risk.
         *
         * `remote_fees_id` may use different transfer type than rest of `assets` and can be
         * specified through `fees_transfer_type`.
         *
         * The caller needs to specify what should happen to the transferred assets once they reach
         * the `dest` chain. This is done through the `custom_xcm_on_dest` parameter, which
         * contains the instructions to execute on `dest` as a final step.
         * This is usually as simple as:
         * `Xcm(vec![DepositAsset { assets: Wild(AllCounted(assets.len())), beneficiary }])`,
         * but could be something more exotic like sending the `assets` even further.
         *
         * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
         * - `dest`: Destination context for the assets. Will typically be `[Parent,
         * Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
         * relay to parachain, or `(parents: 2, (GlobalConsensus(..), ..))` to send from
         * parachain across a bridge to another ecosystem destination.
         * - `assets`: The assets to be withdrawn. This should include the assets used to pay the
         * fee on the `dest` (and possibly reserve) chains.
         * - `assets_transfer_type`: The XCM `TransferType` used to transfer the `assets`.
         * - `remote_fees_id`: One of the included `assets` to be used to pay fees.
         * - `fees_transfer_type`: The XCM `TransferType` used to transfer the `fees` assets.
         * - `custom_xcm_on_dest`: The XCM to be executed on `dest` chain as the last step of the
         * transfer, which also determines what happens to the assets on the destination chain.
         * - `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
         */
        transfer_assets_using_type_and_then: TxDescriptor<Anonymize<I8k1luiflpk9v7>>;
        /**
         * Authorize another `aliaser` location to alias into the local `origin` making this call.
         * The `aliaser` is only authorized until the provided `expiry` block number.
         * The call can also be used for a previously authorized alias in order to update its
         * `expiry` block number.
         *
         * Usually useful to allow your local account to be aliased into from a remote location
         * also under your control (like your account on another chain).
         *
         * WARNING: make sure the caller `origin` (you) trusts the `aliaser` location to act in
         * their/your name. Once authorized using this call, the `aliaser` can freely impersonate
         * `origin` in XCM programs executed on the local chain.
         */
        add_authorized_alias: TxDescriptor<Anonymize<Iauhjqifrdklq7>>;
        /**
         * Remove a previously authorized `aliaser` from the list of locations that can alias into
         * the local `origin` making this call.
         */
        remove_authorized_alias: TxDescriptor<Anonymize<Ie1uso9m8rt5cf>>;
        /**
         * Remove all previously authorized `aliaser`s that can alias into the local `origin`
         * making this call.
         */
        remove_all_authorized_aliases: TxDescriptor<undefined>;
    };
    MessageQueue: {
        /**
         * Remove a page which has no more messages remaining to be processed or is stale.
         */
        reap_page: TxDescriptor<Anonymize<I40pqum1mu8qg3>>;
        /**
         * Execute an overweight message.
         *
         * Temporary processing errors will be propagated whereas permanent errors are treated
         * as success condition.
         *
         * - `origin`: Must be `Signed`.
         * - `message_origin`: The origin from which the message to be executed arrived.
         * - `page`: The page in the queue in which the message to be executed is sitting.
         * - `index`: The index into the queue of the message to be executed.
         * - `weight_limit`: The maximum amount of weight allowed to be consumed in the execution
         * of the message.
         *
         * Benchmark complexity considerations: O(index + weight_limit).
         */
        execute_overweight: TxDescriptor<Anonymize<I1r4c2ghbtvjuc>>;
    };
    Ismp: {
        /**
         * Execute the provided batch of ISMP messages, this will short-circuit and revert if any
         * of the provided messages are invalid. This is an unsigned extrinsic that permits anyone
         * execute ISMP messages for free, provided they have valid proofs and the messages have
         * not been previously processed.
         *
         * The dispatch origin for this call must be an unsigned one.
         *
         * - `messages`: the messages to handle or process.
         *
         * Emits different message events based on the Message received if successful.
         */
        handle_unsigned: TxDescriptor<Anonymize<I8upsupg73d8i4>>;
        /**
         * Create a consensus client, using a subjectively chosen consensus state. This can also
         * be used to overwrite an existing consensus state. The dispatch origin for this
         * call must be `T::AdminOrigin`.
         *
         * - `message`: [`CreateConsensusState`] struct.
         *
         * Emits [`Event::ConsensusClientCreated`] if successful.
         */
        create_consensus_client: TxDescriptor<Anonymize<Il479ga6jla1a>>;
        /**
         * Modify the unbonding period and challenge period for a consensus state.
         * The dispatch origin for this call must be `T::AdminOrigin`.
         *
         * - `message`: `UpdateConsensusState` struct.
         */
        update_consensus_state: TxDescriptor<Anonymize<Iepqv071dqickc>>;
        /**
         * Add more funds to a message (request or response) to be used for delivery and execution.
         *
         * Should not be called on a message that has been completed (delivered or timed-out) as
         * those funds will be lost forever.
         */
        fund_message: TxDescriptor<Anonymize<I739ltdlbnqckb>>;
    };
    IsmpParachain: {
        /**
         * This allows block builders submit parachain consensus proofs as inherents. If the
         * provided [`ConsensusMessage`] is not for a parachain, this call will fail.
         */
        update_parachain_consensus: TxDescriptor<Anonymize<I5nk49fqq83rft>>;
        /**
         * Add some new parachains to the parachains whitelist
         */
        add_parachain: TxDescriptor<Anonymize<Ivalbtb85o2h0>>;
        /**
         * Removes some parachains from the parachains whitelist
         */
        remove_parachain: TxDescriptor<Anonymize<Ic8hk838gccoml>>;
    };
    Contracts: {
        /**
         * Deprecated version if [`Self::call`] for use in an in-storage `Call`.
         */
        call_old_weight: TxDescriptor<Anonymize<Ia2rnh5pfua40a>>;
        /**
         * Deprecated version if [`Self::instantiate_with_code`] for use in an in-storage `Call`.
         */
        instantiate_with_code_old_weight: TxDescriptor<Anonymize<I3otc7e9a35k1k>>;
        /**
         * Deprecated version if [`Self::instantiate`] for use in an in-storage `Call`.
         */
        instantiate_old_weight: TxDescriptor<Anonymize<I89ier5tb9ne0s>>;
        /**
         * Upload new `code` without instantiating a contract from it.
         *
         * If the code does not already exist a deposit is reserved from the caller
         * and unreserved only when [`Self::remove_code`] is called. The size of the reserve
         * depends on the size of the supplied `code`.
         *
         * If the code already exists in storage it will still return `Ok` and upgrades
         * the in storage version to the current
         * [`InstructionWeights::version`](InstructionWeights).
         *
         * - `determinism`: If this is set to any other value but [`Determinism::Enforced`] then
         * the only way to use this code is to delegate call into it from an offchain execution.
         * Set to [`Determinism::Enforced`] if in doubt.
         *
         * # Note
         *
         * Anyone can instantiate a contract from any uploaded code and thus prevent its removal.
         * To avoid this situation a constructor could employ access control so that it can
         * only be instantiated by permissioned entities. The same is true when uploading
         * through [`Self::instantiate_with_code`].
         *
         * Use [`Determinism::Relaxed`] exclusively for non-deterministic code. If the uploaded
         * code is deterministic, specifying [`Determinism::Relaxed`] will be disregarded and
         * result in higher gas costs.
         */
        upload_code: TxDescriptor<Anonymize<Im2f0numhevg3>>;
        /**
         * Remove the code stored under `code_hash` and refund the deposit to its owner.
         *
         * A code can only be removed by its original uploader (its owner) and only if it is
         * not used by any contract.
         */
        remove_code: TxDescriptor<Anonymize<Ib51vk42m1po4n>>;
        /**
         * Privileged function that changes the code of an existing contract.
         *
         * This takes care of updating refcounts and all other necessary operations. Returns
         * an error if either the `code_hash` or `dest` do not exist.
         *
         * # Note
         *
         * This does **not** change the address of the contract in question. This means
         * that the contract address is no longer derived from its code hash after calling
         * this dispatchable.
         */
        set_code: TxDescriptor<Anonymize<I2agkcpojhkk43>>;
        /**
         * Makes a call to an account, optionally transferring some balance.
         *
         * # Parameters
         *
         * * `dest`: Address of the contract to call.
         * * `value`: The balance to transfer from the `origin` to `dest`.
         * * `gas_limit`: The gas limit enforced when executing the constructor.
         * * `storage_deposit_limit`: The maximum amount of balance that can be charged from the
         * caller to pay for the storage consumed.
         * * `data`: The input data to pass to the contract.
         *
         * * If the account is a smart-contract account, the associated code will be
         * executed and any value will be transferred.
         * * If the account is a regular account, any value will be transferred.
         * * If no account exists and the call value is not less than `existential_deposit`,
         * a regular account will be created and any value will be transferred.
         */
        call: TxDescriptor<Anonymize<I32rvg545edabm>>;
        /**
         * Instantiates a new contract from the supplied `code` optionally transferring
         * some balance.
         *
         * This dispatchable has the same effect as calling [`Self::upload_code`] +
         * [`Self::instantiate`]. Bundling them together provides efficiency gains. Please
         * also check the documentation of [`Self::upload_code`].
         *
         * # Parameters
         *
         * * `value`: The balance to transfer from the `origin` to the newly created contract.
         * * `gas_limit`: The gas limit enforced when executing the constructor.
         * * `storage_deposit_limit`: The maximum amount of balance that can be charged/reserved
         * from the caller to pay for the storage consumed.
         * * `code`: The contract code to deploy in raw bytes.
         * * `data`: The input data to pass to the contract constructor.
         * * `salt`: Used for the address derivation. See [`Pallet::contract_address`].
         *
         * Instantiation is executed as follows:
         *
         * - The supplied `code` is deployed, and a `code_hash` is created for that code.
         * - If the `code_hash` already exists on the chain the underlying `code` will be shared.
         * - The destination address is computed based on the sender, code_hash and the salt.
         * - The smart-contract account is created at the computed address.
         * - The `value` is transferred to the new account.
         * - The `deploy` function is executed in the context of the newly-created account.
         */
        instantiate_with_code: TxDescriptor<Anonymize<I83fv0vi59md7i>>;
        /**
         * Instantiates a contract from a previously deployed wasm binary.
         *
         * This function is identical to [`Self::instantiate_with_code`] but without the
         * code deployment step. Instead, the `code_hash` of an on-chain deployed wasm binary
         * must be supplied.
         */
        instantiate: TxDescriptor<Anonymize<I5tjjqcdd4tae0>>;
        /**
         * When a migration is in progress, this dispatchable can be used to run migration steps.
         * Calls that contribute to advancing the migration have their fees waived, as it's helpful
         * for the chain. Note that while the migration is in progress, the pallet will also
         * leverage the `on_idle` hooks to run migration steps.
         */
        migrate: TxDescriptor<Anonymize<I1894dm1lf1ae7>>;
    };
    Proxy: {
        /**
         * Dispatch the given `call` from an account that the sender is authorised for through
         * `add_proxy`.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `real`: The account that the proxy will make a call on behalf of.
         * - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
         * - `call`: The call to be made by the `real` account.
         */
        proxy: TxDescriptor<Anonymize<Ibg2pbq43u3kek>>;
        /**
         * Register a proxy account for the sender that is able to make calls on its behalf.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `proxy`: The account that the `caller` would like to make a proxy.
         * - `proxy_type`: The permissions allowed for this proxy account.
         * - `delay`: The announcement period required of the initial proxy. Will generally be
         * zero.
         */
        add_proxy: TxDescriptor<Anonymize<Iovrcu9bfelfq>>;
        /**
         * Unregister a proxy account for the sender.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `proxy`: The account that the `caller` would like to remove as a proxy.
         * - `proxy_type`: The permissions currently enabled for the removed proxy account.
         */
        remove_proxy: TxDescriptor<Anonymize<Iovrcu9bfelfq>>;
        /**
         * Unregister all proxy accounts for the sender.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * WARNING: This may be called on accounts created by `pure`, however if done, then
         * the unreserved fees will be inaccessible. **All access to this account will be lost.**
         */
        remove_proxies: TxDescriptor<undefined>;
        /**
         * Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and
         * initialize it with a proxy of `proxy_type` for `origin` sender.
         *
         * Requires a `Signed` origin.
         *
         * - `proxy_type`: The type of the proxy that the sender will be registered as over the
         * new account. This will almost always be the most permissive `ProxyType` possible to
         * allow for maximum flexibility.
         * - `index`: A disambiguation index, in case this is called multiple times in the same
         * transaction (e.g. with `utility::batch`). Unless you're using `batch` you probably just
         * want to use `0`.
         * - `delay`: The announcement period required of the initial proxy. Will generally be
         * zero.
         *
         * Fails with `Duplicate` if this has already been called in this transaction, from the
         * same sender, with the same parameters.
         *
         * Fails if there are insufficient funds to pay for deposit.
         */
        create_pure: TxDescriptor<Anonymize<Iefr8jgtgfk8um>>;
        /**
         * Removes a previously spawned pure proxy.
         *
         * WARNING: **All access to this account will be lost.** Any funds held in it will be
         * inaccessible.
         *
         * Requires a `Signed` origin, and the sender account must have been created by a call to
         * `pure` with corresponding parameters.
         *
         * - `spawner`: The account that originally called `pure` to create this account.
         * - `index`: The disambiguation index originally passed to `pure`. Probably `0`.
         * - `proxy_type`: The proxy type originally passed to `pure`.
         * - `height`: The height of the chain when the call to `pure` was processed.
         * - `ext_index`: The extrinsic index in which the call to `pure` was processed.
         *
         * Fails with `NoPermission` in case the caller is not a previously created pure
         * account whose `pure` call has corresponding parameters.
         */
        kill_pure: TxDescriptor<Anonymize<I3j05hul54uj7q>>;
        /**
         * Publish the hash of a proxy-call that will be made in the future.
         *
         * This must be called some number of blocks before the corresponding `proxy` is attempted
         * if the delay associated with the proxy relationship is greater than zero.
         *
         * No more than `MaxPending` announcements may be made at any one time.
         *
         * This will take a deposit of `AnnouncementDepositFactor` as well as
         * `AnnouncementDepositBase` if there are no other pending announcements.
         *
         * The dispatch origin for this call must be _Signed_ and a proxy of `real`.
         *
         * Parameters:
         * - `real`: The account that the proxy will make a call on behalf of.
         * - `call_hash`: The hash of the call to be made by the `real` account.
         */
        announce: TxDescriptor<Anonymize<I2eb501t8s6hsq>>;
        /**
         * Remove a given announcement.
         *
         * May be called by a proxy account to remove a call they previously announced and return
         * the deposit.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `real`: The account that the proxy will make a call on behalf of.
         * - `call_hash`: The hash of the call to be made by the `real` account.
         */
        remove_announcement: TxDescriptor<Anonymize<I2eb501t8s6hsq>>;
        /**
         * Remove the given announcement of a delegate.
         *
         * May be called by a target (proxied) account to remove a call that one of their delegates
         * (`delegate`) has announced they want to execute. The deposit is returned.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `delegate`: The account that previously announced the call.
         * - `call_hash`: The hash of the call to be made.
         */
        reject_announcement: TxDescriptor<Anonymize<Ianmuoljk2sk1u>>;
        /**
         * Dispatch the given `call` from an account that the sender is authorized for through
         * `add_proxy`.
         *
         * Removes any corresponding announcement(s).
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * Parameters:
         * - `real`: The account that the proxy will make a call on behalf of.
         * - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
         * - `call`: The call to be made by the `real` account.
         */
        proxy_announced: TxDescriptor<Anonymize<I4ffoom50mpgqs>>;
        /**
         * Poke / Adjust deposits made for proxies and announcements based on current values.
         * This can be used by accounts to possibly lower their locked amount.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * The transaction fee is waived if the deposit amount has changed.
         *
         * Emits `DepositPoked` if successful.
         */
        poke_deposit: TxDescriptor<undefined>;
    };
    Multisig: {
        /**
         * Immediately dispatch a multi-signature call using a single approval from the caller.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * - `other_signatories`: The accounts (other than the sender) who are part of the
         * multi-signature, but do not participate in the approval process.
         * - `call`: The call to be executed.
         *
         * Result is equivalent to the dispatched result.
         *
         * ## Complexity
         * O(Z + C) where Z is the length of the call and C its execution weight.
         */
        as_multi_threshold_1: TxDescriptor<Anonymize<Idn6i85kjn6h8r>>;
        /**
         * Register approval for a dispatch to be made from a deterministic composite account if
         * approved by a total of `threshold - 1` of `other_signatories`.
         *
         * If there are enough, then dispatch the call.
         *
         * Payment: `DepositBase` will be reserved if this is the first approval, plus
         * `threshold` times `DepositFactor`. It is returned once this dispatch happens or
         * is cancelled.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * - `threshold`: The total number of approvals for this dispatch before it is executed.
         * - `other_signatories`: The accounts (other than the sender) who can approve this
         * dispatch. May not be empty.
         * - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
         * not the first approval, then it must be `Some`, with the timepoint (block number and
         * transaction index) of the first approval transaction.
         * - `call`: The call to be executed.
         *
         * NOTE: Unless this is the final approval, you will generally want to use
         * `approve_as_multi` instead, since it only requires a hash of the call.
         *
         * Result is equivalent to the dispatched result if `threshold` is exactly `1`. Otherwise
         * on success, result is `Ok` and the result from the interior call, if it was executed,
         * may be found in the deposited `MultisigExecuted` event.
         *
         * ## Complexity
         * - `O(S + Z + Call)`.
         * - Up to one balance-reserve or unreserve operation.
         * - One passthrough operation, one insert, both `O(S)` where `S` is the number of
         * signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
         * - One call encode & hash, both of complexity `O(Z)` where `Z` is tx-len.
         * - One encode & hash, both of complexity `O(S)`.
         * - Up to one binary search and insert (`O(logS + S)`).
         * - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
         * - One event.
         * - The weight of the `call`.
         * - Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
         * taken for its lifetime of `DepositBase + threshold * DepositFactor`.
         */
        as_multi: TxDescriptor<Anonymize<Ifoi071p509ebc>>;
        /**
         * Register approval for a dispatch to be made from a deterministic composite account if
         * approved by a total of `threshold - 1` of `other_signatories`.
         *
         * Payment: `DepositBase` will be reserved if this is the first approval, plus
         * `threshold` times `DepositFactor`. It is returned once this dispatch happens or
         * is cancelled.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * - `threshold`: The total number of approvals for this dispatch before it is executed.
         * - `other_signatories`: The accounts (other than the sender) who can approve this
         * dispatch. May not be empty.
         * - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
         * not the first approval, then it must be `Some`, with the timepoint (block number and
         * transaction index) of the first approval transaction.
         * - `call_hash`: The hash of the call to be executed.
         *
         * NOTE: If this is the final approval, you will want to use `as_multi` instead.
         *
         * ## Complexity
         * - `O(S)`.
         * - Up to one balance-reserve or unreserve operation.
         * - One passthrough operation, one insert, both `O(S)` where `S` is the number of
         * signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
         * - One encode & hash, both of complexity `O(S)`.
         * - Up to one binary search and insert (`O(logS + S)`).
         * - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
         * - One event.
         * - Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
         * taken for its lifetime of `DepositBase + threshold * DepositFactor`.
         */
        approve_as_multi: TxDescriptor<Anonymize<Ideaemvoneh309>>;
        /**
         * Cancel a pre-existing, on-going multisig transaction. Any deposit reserved previously
         * for this operation will be unreserved on success.
         *
         * The dispatch origin for this call must be _Signed_.
         *
         * - `threshold`: The total number of approvals for this dispatch before it is executed.
         * - `other_signatories`: The accounts (other than the sender) who can approve this
         * dispatch. May not be empty.
         * - `timepoint`: The timepoint (block number and transaction index) of the first approval
         * transaction for this dispatch.
         * - `call_hash`: The hash of the call to be executed.
         *
         * ## Complexity
         * - `O(S)`.
         * - Up to one balance-reserve or unreserve operation.
         * - One passthrough operation, one insert, both `O(S)` where `S` is the number of
         * signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
         * - One encode & hash, both of complexity `O(S)`.
         * - One event.
         * - I/O: 1 read `O(S)`, one remove.
         * - Storage: removes one item.
         */
        cancel_as_multi: TxDescriptor<Anonymize<I3d9o9d7epp66v>>;
        /**
         * Poke the deposit reserved for an existing multisig operation.
         *
         * The dispatch origin for this call must be _Signed_ and must be the original depositor of
         * the multisig operation.
         *
         * The transaction fee is waived if the deposit amount has changed.
         *
         * - `threshold`: The total number of approvals needed for this multisig.
         * - `other_signatories`: The accounts (other than the sender) who are part of the
         * multisig.
         * - `call_hash`: The hash of the call this deposit is reserved for.
         *
         * Emits `DepositPoked` if successful.
         */
        poke_deposit: TxDescriptor<Anonymize<I6lqh1vgb4mcja>>;
    };
    Utility: {
        /**
         * Send a batch of dispatch calls.
         *
         * May be called from any origin except `None`.
         *
         * - `calls`: The calls to be dispatched from the same origin. The number of call must not
         * exceed the constant: `batched_calls_limit` (available in constant metadata).
         *
         * If origin is root then the calls are dispatched without checking origin filter. (This
         * includes bypassing `frame_system::Config::BaseCallFilter`).
         *
         * ## Complexity
         * - O(C) where C is the number of calls to be batched.
         *
         * This will return `Ok` in all circumstances. To determine the success of the batch, an
         * event is deposited. If a call failed and the batch was interrupted, then the
         * `BatchInterrupted` event is deposited, along with the number of successful calls made
         * and the error of the failed call. If all were successful, then the `BatchCompleted`
         * event is deposited.
         */
        batch: TxDescriptor<Anonymize<I1pkn45df0p8gs>>;
        /**
         * Send a call through an indexed pseudonym of the sender.
         *
         * Filter from origin are passed along. The call will be dispatched with an origin which
         * use the same filter as the origin of this call.
         *
         * NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
         * because you expect `proxy` to have been used prior in the call stack and you do not want
         * the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
         * in the Multisig pallet instead.
         *
         * NOTE: Prior to version *12, this was called `as_limited_sub`.
         *
         * The dispatch origin for this call must be _Signed_.
         */
        as_derivative: TxDescriptor<Anonymize<I5846tcbuvjclf>>;
        /**
         * Send a batch of dispatch calls and atomically execute them.
         * The whole transaction will rollback and fail if any of the calls failed.
         *
         * May be called from any origin except `None`.
         *
         * - `calls`: The calls to be dispatched from the same origin. The number of call must not
         * exceed the constant: `batched_calls_limit` (available in constant metadata).
         *
         * If origin is root then the calls are dispatched without checking origin filter. (This
         * includes bypassing `frame_system::Config::BaseCallFilter`).
         *
         * ## Complexity
         * - O(C) where C is the number of calls to be batched.
         */
        batch_all: TxDescriptor<Anonymize<I1pkn45df0p8gs>>;
        /**
         * Dispatches a function call with a provided origin.
         *
         * The dispatch origin for this call must be _Root_.
         *
         * ## Complexity
         * - O(1).
         */
        dispatch_as: TxDescriptor<Anonymize<If62pc69t7sugd>>;
        /**
         * Send a batch of dispatch calls.
         * Unlike `batch`, it allows errors and won't interrupt.
         *
         * May be called from any origin except `None`.
         *
         * - `calls`: The calls to be dispatched from the same origin. The number of call must not
         * exceed the constant: `batched_calls_limit` (available in constant metadata).
         *
         * If origin is root then the calls are dispatch without checking origin filter. (This
         * includes bypassing `frame_system::Config::BaseCallFilter`).
         *
         * ## Complexity
         * - O(C) where C is the number of calls to be batched.
         */
        force_batch: TxDescriptor<Anonymize<I1pkn45df0p8gs>>;
        /**
         * Dispatch a function call with a specified weight.
         *
         * This function does not check the weight of the call, and instead allows the
         * Root origin to specify the weight of the call.
         *
         * The dispatch origin for this call must be _Root_.
         */
        with_weight: TxDescriptor<Anonymize<Ib4q9jf1uph4bc>>;
        /**
         * Dispatch a fallback call in the event the main call fails to execute.
         * May be called from any origin except `None`.
         *
         * This function first attempts to dispatch the `main` call.
         * If the `main` call fails, the `fallback` is attemted.
         * if the fallback is successfully dispatched, the weights of both calls
         * are accumulated and an event containing the main call error is deposited.
         *
         * In the event of a fallback failure the whole call fails
         * with the weights returned.
         *
         * - `main`: The main call to be dispatched. This is the primary action to execute.
         * - `fallback`: The fallback call to be dispatched in case the `main` call fails.
         *
         * ## Dispatch Logic
         * - If the origin is `root`, both the main and fallback calls are executed without
         * applying any origin filters.
         * - If the origin is not `root`, the origin filter is applied to both the `main` and
         * `fallback` calls.
         *
         * ## Use Case
         * - Some use cases might involve submitting a `batch` type call in either main, fallback
         * or both.
         */
        if_else: TxDescriptor<Anonymize<Ifrfavu6fncvt3>>;
        /**
         * Dispatches a function call with a provided origin.
         *
         * Almost the same as [`Pallet::dispatch_as`] but forwards any error of the inner call.
         *
         * The dispatch origin for this call must be _Root_.
         */
        dispatch_as_fallible: TxDescriptor<Anonymize<If62pc69t7sugd>>;
    };
    Nfts: {
        /**
         * Issue a new collection of non-fungible items from a public origin.
         *
         * This new collection has no items initially and its owner is the origin.
         *
         * The origin must be Signed and the sender must have sufficient funds free.
         *
         * `CollectionDeposit` funds of sender are reserved.
         *
         * Parameters:
         * - `admin`: The admin of this collection. The admin is the initial address of each
         * member of the collection's admin team.
         *
         * Emits `Created` event when successful.
         *
         * Weight: `O(1)`
         */
        create: TxDescriptor<Anonymize<I43aobns89nbkh>>;
        /**
         * Issue a new collection of non-fungible items from a privileged origin.
         *
         * This new collection has no items initially.
         *
         * The origin must conform to `ForceOrigin`.
         *
         * Unlike `create`, no funds are reserved.
         *
         * - `owner`: The owner of this collection of items. The owner has full superuser
         * permissions over this item, but may later change and configure the permissions using
         * `transfer_ownership` and `set_team`.
         *
         * Emits `ForceCreated` event when successful.
         *
         * Weight: `O(1)`
         */
        force_create: TxDescriptor<Anonymize<Iamd7rovec1hfb>>;
        /**
         * Destroy a collection of fungible items.
         *
         * The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be the
         * owner of the `collection`.
         *
         * NOTE: The collection must have 0 items to be destroyed.
         *
         * - `collection`: The identifier of the collection to be destroyed.
         * - `witness`: Information on the items minted in the collection. This must be
         * correct.
         *
         * Emits `Destroyed` event when successful.
         *
         * Weight: `O(m + c + a)` where:
         * - `m = witness.item_metadatas`
         * - `c = witness.item_configs`
         * - `a = witness.attributes`
         */
        destroy: TxDescriptor<Anonymize<I77ie723ncd4co>>;
        /**
         * Mint an item of a particular collection.
         *
         * The origin must be Signed and the sender must comply with the `mint_settings` rules.
         *
         * - `collection`: The collection of the item to be minted.
         * - `item`: An identifier of the new item.
         * - `mint_to`: Account into which the item will be minted.
         * - `witness_data`: When the mint type is `HolderOf(collection_id)`, then the owned
         * item_id from that collection needs to be provided within the witness data object. If
         * the mint price is set, then it should be additionally confirmed in the `witness_data`.
         *
         * Note: the deposit will be taken from the `origin` and not the `owner` of the `item`.
         *
         * Emits `Issued` event when successful.
         *
         * Weight: `O(1)`
         */
        mint: TxDescriptor<Anonymize<Ieebloeahma3ke>>;
        /**
         * Mint an item of a particular collection from a privileged origin.
         *
         * The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be the
         * Issuer of the `collection`.
         *
         * - `collection`: The collection of the item to be minted.
         * - `item`: An identifier of the new item.
         * - `mint_to`: Account into which the item will be minted.
         * - `item_config`: A config of the new item.
         *
         * Emits `Issued` event when successful.
         *
         * Weight: `O(1)`
         */
        force_mint: TxDescriptor<Anonymize<I4mbtpf4pu3rec>>;
        /**
         * Destroy a single item.
         *
         * The origin must conform to `ForceOrigin` or must be Signed and the signing account must
         * be the owner of the `item`.
         *
         * - `collection`: The collection of the item to be burned.
         * - `item`: The item to be burned.
         *
         * Emits `Burned`.
         *
         * Weight: `O(1)`
         */
        burn: TxDescriptor<Anonymize<Iafkqus0ohh6l6>>;
        /**
         * Move an item from the sender account to another.
         *
         * Origin must be Signed and the signing account must be either:
         * - the Owner of the `item`;
         * - the approved delegate for the `item` (in this case, the approval is reset).
         *
         * Arguments:
         * - `collection`: The collection of the item to be transferred.
         * - `item`: The item to be transferred.
         * - `dest`: The account to receive ownership of the item.
         *
         * Emits `Transferred`.
         *
         * Weight: `O(1)`
         */
        transfer: TxDescriptor<Anonymize<Ibgvkh96s68a66>>;
        /**
         * Re-evaluate the deposits on some items.
         *
         * Origin must be Signed and the sender should be the Owner of the `collection`.
         *
         * - `collection`: The collection of the items to be reevaluated.
         * - `items`: The items of the collection whose deposits will be reevaluated.
         *
         * NOTE: This exists as a best-effort function. Any items which are unknown or
         * in the case that the owner account does not have reservable funds to pay for a
         * deposit increase are ignored. Generally the owner isn't going to call this on items
         * whose existing deposit is less than the refreshed deposit as it would only cost them,
         * so it's of little consequence.
         *
         * It will still return an error in the case that the collection is unknown or the signer
         * is not permitted to call it.
         *
         * Weight: `O(items.len())`
         */
        redeposit: TxDescriptor<Anonymize<If9vko7pv0231m>>;
        /**
         * Disallow further unprivileged transfer of an item.
         *
         * Origin must be Signed and the sender should be the Freezer of the `collection`.
         *
         * - `collection`: The collection of the item to be changed.
         * - `item`: The item to become non-transferable.
         *
         * Emits `ItemTransferLocked`.
         *
         * Weight: `O(1)`
         */
        lock_item_transfer: TxDescriptor<Anonymize<Iafkqus0ohh6l6>>;
        /**
         * Re-allow unprivileged transfer of an item.
         *
         * Origin must be Signed and the sender should be the Freezer of the `collection`.
         *
         * - `collection`: The collection of the item to be changed.
         * - `item`: The item to become transferable.
         *
         * Emits `ItemTransferUnlocked`.
         *
         * Weight: `O(1)`
         */
        unlock_item_transfer: TxDescriptor<Anonymize<Iafkqus0ohh6l6>>;
        /**
         * Disallows specified settings for the whole collection.
         *
         * Origin must be Signed and the sender should be the Owner of the `collection`.
         *
         * - `collection`: The collection to be locked.
         * - `lock_settings`: The settings to be locked.
         *
         * Note: it's possible to only lock(set) the setting, but not to unset it.
         *
         * Emits `CollectionLocked`.
         *
         * Weight: `O(1)`
         */
        lock_collection: TxDescriptor<Anonymize<I1ahf3pvgsgbu>>;
        /**
         * Change the Owner of a collection.
         *
         * Origin must be Signed and the sender should be the Owner of the `collection`.
         *
         * - `collection`: The collection whose owner should be changed.
         * - `owner`: The new Owner of this collection. They must have called
         * `set_accept_ownership` with `collection` in order for this operation to succeed.
         *
         * Emits `OwnerChanged`.
         *
         * Weight: `O(1)`
         */
        transfer_ownership: TxDescriptor<Anonymize<I736lv5q9m5bot>>;
        /**
         * Change the Issuer, Admin and Freezer of a collection.
         *
         * Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
         * `collection`.
         *
         * Note: by setting the role to `None` only the `ForceOrigin` will be able to change it
         * after to `Some(account)`.
         *
         * - `collection`: The collection whose team should be changed.
         * - `issuer`: The new Issuer of this collection.
         * - `admin`: The new Admin of this collection.
         * - `freezer`: The new Freezer of this collection.
         *
         * Emits `TeamChanged`.
         *
         * Weight: `O(1)`
         */
        set_team: TxDescriptor<Anonymize<I9uapdn16emsti>>;
        /**
         * Change the Owner of a collection.
         *
         * Origin must be `ForceOrigin`.
         *
         * - `collection`: The identifier of the collection.
         * - `owner`: The new Owner of this collection.
         *
         * Emits `OwnerChanged`.
         *
         * Weight: `O(1)`
         */
        force_collection_owner: TxDescriptor<Anonymize<Ie5i0q2glmr0md>>;
        /**
         * Change the config of a collection.
         *
         * Origin must be `ForceOrigin`.
         *
         * - `collection`: The identifier of the collection.
         * - `config`: The new config of this collection.
         *
         * Emits `CollectionConfigChanged`.
         *
         * Weight: `O(1)`
         */
        force_collection_config: TxDescriptor<Anonymize<I97qcg6i3l8gee>>;
        /**
         * Approve an item to be transferred by a delegated third-party account.
         *
         * Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
         * `item`.
         *
         * - `collection`: The collection of the item to be approved for delegated transfer.
         * - `item`: The item to be approved for delegated transfer.
         * - `delegate`: The account to delegate permission to transfer the item.
         * - `maybe_deadline`: Optional deadline for the approval. Specified by providing the
         * number of blocks after which the approval will expire
         *
         * Emits `TransferApproved` on success.
         *
         * Weight: `O(1)`
         */
        approve_transfer: TxDescriptor<Anonymize<Ib5udrahak005b>>;
        /**
         * Cancel one of the transfer approvals for a specific item.
         *
         * Origin must be either:
         * - the `Force` origin;
         * - `Signed` with the signer being the Owner of the `item`;
         *
         * Arguments:
         * - `collection`: The collection of the item of whose approval will be cancelled.
         * - `item`: The item of the collection of whose approval will be cancelled.
         * - `delegate`: The account that is going to loose their approval.
         *
         * Emits `ApprovalCancelled` on success.
         *
         * Weight: `O(1)`
         */
        cancel_approval: TxDescriptor<Anonymize<Ib92t90p616grb>>;
        /**
         * Cancel all the approvals of a specific item.
         *
         * Origin must be either:
         * - the `Force` origin;
         * - `Signed` with the signer being the Owner of the `item`;
         *
         * Arguments:
         * - `collection`: The collection of the item of whose approvals will be cleared.
         * - `item`: The item of the collection of whose approvals will be cleared.
         *
         * Emits `AllApprovalsCancelled` on success.
         *
         * Weight: `O(1)`
         */
        clear_all_transfer_approvals: TxDescriptor<Anonymize<Iafkqus0ohh6l6>>;
        /**
         * Disallows changing the metadata or attributes of the item.
         *
         * Origin must be either `ForceOrigin` or Signed and the sender should be the Admin
         * of the `collection`.
         *
         * - `collection`: The collection if the `item`.
         * - `item`: An item to be locked.
         * - `lock_metadata`: Specifies whether the metadata should be locked.
         * - `lock_attributes`: Specifies whether the attributes in the `CollectionOwner` namespace
         * should be locked.
         *
         * Note: `lock_attributes` affects the attributes in the `CollectionOwner` namespace only.
         * When the metadata or attributes are locked, it won't be possible the unlock them.
         *
         * Emits `ItemPropertiesLocked`.
         *
         * Weight: `O(1)`
         */
        lock_item_properties: TxDescriptor<Anonymize<I1jj31tn29ie3c>>;
        /**
         * Set an attribute for a collection or item.
         *
         * Origin must be Signed and must conform to the namespace ruleset:
         * - `CollectionOwner` namespace could be modified by the `collection` Admin only;
         * - `ItemOwner` namespace could be modified by the `maybe_item` owner only. `maybe_item`
         * should be set in that case;
         * - `Account(AccountId)` namespace could be modified only when the `origin` was given a
         * permission to do so;
         *
         * The funds of `origin` are reserved according to the formula:
         * `AttributeDepositBase + DepositPerByte * (key.len + value.len)` taking into
         * account any already reserved funds.
         *
         * - `collection`: The identifier of the collection whose item's metadata to set.
         * - `maybe_item`: The identifier of the item whose metadata to set.
         * - `namespace`: Attribute's namespace.
         * - `key`: The key of the attribute.
         * - `value`: The value to which to set the attribute.
         *
         * Emits `AttributeSet`.
         *
         * Weight: `O(1)`
         */
        set_attribute: TxDescriptor<Anonymize<I5llu6o6a0go5i>>;
        /**
         * Force-set an attribute for a collection or item.
         *
         * Origin must be `ForceOrigin`.
         *
         * If the attribute already exists and it was set by another account, the deposit
         * will be returned to the previous owner.
         *
         * - `set_as`: An optional owner of the attribute.
         * - `collection`: The identifier of the collection whose item's metadata to set.
         * - `maybe_item`: The identifier of the item whose metadata to set.
         * - `namespace`: Attribute's namespace.
         * - `key`: The key of the attribute.
         * - `value`: The value to which to set the attribute.
         *
         * Emits `AttributeSet`.
         *
         * Weight: `O(1)`
         */
        force_set_attribute: TxDescriptor<Anonymize<Ic8b8561e6t9ie>>;
        /**
         * Clear an attribute for a collection or item.
         *
         * Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
         * attribute.
         *
         * Any deposit is freed for the collection's owner.
         *
         * - `collection`: The identifier of the collection whose item's metadata to clear.
         * - `maybe_item`: The identifier of the item whose metadata to clear.
         * - `namespace`: Attribute's namespace.
         * - `key`: The key of the attribute.
         *
         * Emits `AttributeCleared`.
         *
         * Weight: `O(1)`
         */
        clear_attribute: TxDescriptor<Anonymize<I93r2effh7od84>>;
        /**
         * Approve item's attributes to be changed by a delegated third-party account.
         *
         * Origin must be Signed and must be an owner of the `item`.
         *
         * - `collection`: A collection of the item.
         * - `item`: The item that holds attributes.
         * - `delegate`: The account to delegate permission to change attributes of the item.
         *
         * Emits `ItemAttributesApprovalAdded` on success.
         */
        approve_item_attributes: TxDescriptor<Anonymize<Ib92t90p616grb>>;
        /**
         * Cancel the previously provided approval to change item's attributes.
         * All the previously set attributes by the `delegate` will be removed.
         *
         * Origin must be Signed and must be an owner of the `item`.
         *
         * - `collection`: Collection that the item is contained within.
         * - `item`: The item that holds attributes.
         * - `delegate`: The previously approved account to remove.
         *
         * Emits `ItemAttributesApprovalRemoved` on success.
         */
        cancel_item_attributes_approval: TxDescriptor<Anonymize<I6afd7fllr8otc>>;
        /**
         * Set the metadata for an item.
         *
         * Origin must be either `ForceOrigin` or Signed and the sender should be the Admin of the
         * `collection`.
         *
         * If the origin is Signed, then funds of signer are reserved according to the formula:
         * `MetadataDepositBase + DepositPerByte * data.len` taking into
         * account any already reserved funds.
         *
         * - `collection`: The identifier of the collection whose item's metadata to set.
         * - `item`: The identifier of the item whose metadata to set.
         * - `data`: The general information of this item. Limited in length by `StringLimit`.
         *
         * Emits `ItemMetadataSet`.
         *
         * Weight: `O(1)`
         */
        set_metadata: TxDescriptor<Anonymize<Icrkms46uh8tpb>>;
        /**
         * Clear the metadata for an item.
         *
         * Origin must be either `ForceOrigin` or Signed and the sender should be the Admin of the
         * `collection`.
         *
         * Any deposit is freed for the collection's owner.
         *
         * - `collection`: The identifier of the collection whose item's metadata to clear.
         * - `item`: The identifier of the item whose metadata to clear.
         *
         * Emits `ItemMetadataCleared`.
         *
         * Weight: `O(1)`
         */
        clear_metadata: TxDescriptor<Anonymize<Iafkqus0ohh6l6>>;
        /**
         * Set the metadata for a collection.
         *
         * Origin must be either `ForceOrigin` or `Signed` and the sender should be the Admin of
         * the `collection`.
         *
         * If the origin is `Signed`, then funds of signer are reserved according to the formula:
         * `MetadataDepositBase + DepositPerByte * data.len` taking into
         * account any already reserved funds.
         *
         * - `collection`: The identifier of the item whose metadata to update.
         * - `data`: The general information of this item. Limited in length by `StringLimit`.
         *
         * Emits `CollectionMetadataSet`.
         *
         * Weight: `O(1)`
         */
        set_collection_metadata: TxDescriptor<Anonymize<I78u60nqh0etah>>;
        /**
         * Clear the metadata for a collection.
         *
         * Origin must be either `ForceOrigin` or `Signed` and the sender should be the Admin of
         * the `collection`.
         *
         * Any deposit is freed for the collection's owner.
         *
         * - `collection`: The identifier of the collection whose metadata to clear.
         *
         * Emits `CollectionMetadataCleared`.
         *
         * Weight: `O(1)`
         */
        clear_collection_metadata: TxDescriptor<Anonymize<I6cu7obfo0rr0o>>;
        /**
         * Set (or reset) the acceptance of ownership for a particular account.
         *
         * Origin must be `Signed` and if `maybe_collection` is `Some`, then the signer must have a
         * provider reference.
         *
         * - `maybe_collection`: The identifier of the collection whose ownership the signer is
         * willing to accept, or if `None`, an indication that the signer is willing to accept no
         * ownership transferal.
         *
         * Emits `OwnershipAcceptanceChanged`.
         */
        set_accept_ownership: TxDescriptor<Anonymize<Ibqooroq6rr5kr>>;
        /**
         * Set the maximum number of items a collection could have.
         *
         * Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
         * the `collection`.
         *
         * - `collection`: The identifier of the collection to change.
         * - `max_supply`: The maximum number of items a collection could have.
         *
         * Emits `CollectionMaxSupplySet` event when successful.
         */
        set_collection_max_supply: TxDescriptor<Anonymize<I6h88h8vba22v8>>;
        /**
         * Update mint settings.
         *
         * Origin must be either `ForceOrigin` or `Signed` and the sender should be the Issuer
         * of the `collection`.
         *
         * - `collection`: The identifier of the collection to change.
         * - `mint_settings`: The new mint settings.
         *
         * Emits `CollectionMintSettingsUpdated` event when successful.
         */
        update_mint_settings: TxDescriptor<Anonymize<I1lso3vlgherue>>;
        /**
         * Set (or reset) the price for an item.
         *
         * Origin must be Signed and must be the owner of the `item`.
         *
         * - `collection`: The collection of the item.
         * - `item`: The item to set the price for.
         * - `price`: The price for the item. Pass `None`, to reset the price.
         * - `buyer`: Restricts the buy operation to a specific account.
         *
         * Emits `ItemPriceSet` on success if the price is not `None`.
         * Emits `ItemPriceRemoved` on success if the price is `None`.
         */
        set_price: TxDescriptor<Anonymize<Ia9cd4jqb5eecb>>;
        /**
         * Allows to buy an item if it's up for sale.
         *
         * Origin must be Signed and must not be the owner of the `item`.
         *
         * - `collection`: The collection of the item.
         * - `item`: The item the sender wants to buy.
         * - `bid_price`: The price the sender is willing to pay.
         *
         * Emits `ItemBought` on success.
         */
        buy_item: TxDescriptor<Anonymize<I19jiel1ftbcce>>;
        /**
         * Allows to pay the tips.
         *
         * Origin must be Signed.
         *
         * - `tips`: Tips array.
         *
         * Emits `TipSent` on every tip transfer.
         */
        pay_tips: TxDescriptor<Anonymize<I26c8p47106toa>>;
        /**
         * Register a new atomic swap, declaring an intention to send an `item` in exchange for
         * `desired_item` from origin to target on the current blockchain.
         * The target can execute the swap during the specified `duration` of blocks (if set).
         * Additionally, the price could be set for the desired `item`.
         *
         * Origin must be Signed and must be an owner of the `item`.
         *
         * - `collection`: The collection of the item.
         * - `item`: The item an owner wants to give.
         * - `desired_collection`: The collection of the desired item.
         * - `desired_item`: The desired item an owner wants to receive.
         * - `maybe_price`: The price an owner is willing to pay or receive for the desired `item`.
         * - `duration`: A deadline for the swap. Specified by providing the number of blocks
         * after which the swap will expire.
         *
         * Emits `SwapCreated` on success.
         */
        create_swap: TxDescriptor<Anonymize<Iq82b3qvf20ne>>;
        /**
         * Cancel an atomic swap.
         *
         * Origin must be Signed.
         * Origin must be an owner of the `item` if the deadline hasn't expired.
         *
         * - `collection`: The collection of the item.
         * - `item`: The item an owner wants to give.
         *
         * Emits `SwapCancelled` on success.
         */
        cancel_swap: TxDescriptor<Anonymize<Ic3j8ku6mbsms4>>;
        /**
         * Claim an atomic swap.
         * This method executes a pending swap, that was created by a counterpart before.
         *
         * Origin must be Signed and must be an owner of the `item`.
         *
         * - `send_collection`: The collection of the item to be sent.
         * - `send_item`: The item to be sent.
         * - `receive_collection`: The collection of the item to be received.
         * - `receive_item`: The item to be received.
         * - `witness_price`: A price that was previously agreed on.
         *
         * Emits `SwapClaimed` on success.
         */
        claim_swap: TxDescriptor<Anonymize<I3nvoqsi8f05ph>>;
        /**
         * Mint an item by providing the pre-signed approval.
         *
         * Origin must be Signed.
         *
         * - `mint_data`: The pre-signed approval that consists of the information about the item,
         * its metadata, attributes, who can mint it (`None` for anyone) and until what block
         * number.
         * - `signature`: The signature of the `data` object.
         * - `signer`: The `data` object's signer. Should be an Issuer of the collection.
         *
         * Emits `Issued` on success.
         * Emits `AttributeSet` if the attributes were provided.
         * Emits `ItemMetadataSet` if the metadata was not empty.
         */
        mint_pre_signed: TxDescriptor<Anonymize<I3eoft5md071do>>;
        /**
         * Set attributes for an item by providing the pre-signed approval.
         *
         * Origin must be Signed and must be an owner of the `data.item`.
         *
         * - `data`: The pre-signed approval that consists of the information about the item,
         * attributes to update and until what block number.
         * - `signature`: The signature of the `data` object.
         * - `signer`: The `data` object's signer. Should be an Admin of the collection for the
         * `CollectionOwner` namespace.
         *
         * Emits `AttributeSet` for each provided attribute.
         * Emits `ItemAttributesApprovalAdded` if the approval wasn't set before.
         * Emits `PreSignedAttributesSet` on success.
         */
        set_attributes_pre_signed: TxDescriptor<Anonymize<I923eug653ra0o>>;
    };
    NftFractionalization: {
        /**
         * Lock the NFT and mint a new fungible asset.
         *
         * The dispatch origin for this call must be Signed.
         * The origin must be the owner of the NFT they are trying to lock.
         *
         * `Deposit` funds of sender are reserved.
         *
         * - `nft_collection_id`: The ID used to identify the collection of the NFT.
         * Is used within the context of `pallet_nfts`.
         * - `nft_id`: The ID used to identify the NFT within the given collection.
         * Is used within the context of `pallet_nfts`.
         * - `asset_id`: The ID of the new asset. It must not exist.
         * Is used within the context of `pallet_assets`.
         * - `beneficiary`: The account that will receive the newly created asset.
         * - `fractions`: The total issuance of the newly created asset class.
         *
         * Emits `NftFractionalized` event when successful.
         */
        fractionalize: TxDescriptor<Anonymize<I9gf2bs80kgbnk>>;
        /**
         * Burn the total issuance of the fungible asset and return (unlock) the locked NFT.
         *
         * The dispatch origin for this call must be Signed.
         *
         * `Deposit` funds will be returned to `asset_creator`.
         *
         * - `nft_collection_id`: The ID used to identify the collection of the NFT.
         * Is used within the context of `pallet_nfts`.
         * - `nft_id`: The ID used to identify the NFT within the given collection.
         * Is used within the context of `pallet_nfts`.
         * - `asset_id`: The ID of the asset being returned and destroyed. Must match
         * the original ID of the created asset, corresponding to the NFT.
         * Is used within the context of `pallet_assets`.
         * - `beneficiary`: The account that will receive the unified NFT.
         *
         * Emits `NftUnified` event when successful.
         */
        unify: TxDescriptor<Anonymize<I5urb3tva4ave5>>;
    };
    Assets: {
        /**
         * Issue a new class of fungible assets from a public origin.
         *
         * This new asset class has no assets initially and its owner is the origin.
         *
         * The origin must conform to the configured `CreateOrigin` and have sufficient funds free.
         *
         * Funds of sender are reserved by `AssetDeposit`.
         *
         * Parameters:
         * - `id`: The identifier of the new asset. This must not be currently in use to identify
         * an existing asset. If [`NextAssetId`] is set, then this must be equal to it.
         * - `admin`: The admin of this class of assets. The admin is the initial address of each
         * member of the asset class's admin team.
         * - `min_balance`: The minimum balance of this new asset that any single account must
         * have. If an account's balance is reduced below this, then it collapses to zero.
         *
         * Emits `Created` event when successful.
         *
         * Weight: `O(1)`
         */
        create: TxDescriptor<Anonymize<Ic357tcepuvo5c>>;
        /**
         * Issue a new class of fungible assets from a privileged origin.
         *
         * This new asset class has no assets initially.
         *
         * The origin must conform to `ForceOrigin`.
         *
         * Unlike `create`, no funds are reserved.
         *
         * - `id`: The identifier of the new asset. This must not be currently in use to identify
         * an existing asset. If [`NextAssetId`] is set, then this must be equal to it.
         * - `owner`: The owner of this class of assets. The owner has full superuser permissions
         * over this asset, but may later change and configure the permissions using
         * `transfer_ownership` and `set_team`.
         * - `min_balance`: The minimum balance of this new asset that any single account must
         * have. If an account's balance is reduced below this, then it collapses to zero.
         *
         * Emits `ForceCreated` event when successful.
         *
         * Weight: `O(1)`
         */
        force_create: TxDescriptor<Anonymize<I2rnoam876ruhj>>;
        /**
         * Start the process of destroying a fungible asset class.
         *
         * `start_destroy` is the first in a series of extrinsics that should be called, to allow
         * destruction of an asset class.
         *
         * The origin must conform to `ForceOrigin` or must be `Signed` by the asset's `owner`.
         *
         * - `id`: The identifier of the asset to be destroyed. This must identify an existing
         * asset.
         *
         * It will fail with either [`Error::ContainsHolds`] or [`Error::ContainsFreezes`] if
         * an account contains holds or freezes in place.
         */
        start_destroy: TxDescriptor<Anonymize<Ic5b47dj4coa3r>>;
        /**
         * Destroy all accounts associated with a given asset.
         *
         * `destroy_accounts` should only be called after `start_destroy` has been called, and the
         * asset is in a `Destroying` state.
         *
         * Due to weight restrictions, this function may need to be called multiple times to fully
         * destroy all accounts. It will destroy `RemoveItemsLimit` accounts at a time.
         *
         * - `id`: The identifier of the asset to be destroyed. This must identify an existing
         * asset.
         *
         * Each call emits the `Event::DestroyedAccounts` event.
         */
        destroy_accounts: TxDescriptor<Anonymize<Ic5b47dj4coa3r>>;
        /**
         * Destroy all approvals associated with a given asset up to the max (T::RemoveItemsLimit).
         *
         * `destroy_approvals` should only be called after `start_destroy` has been called, and the
         * asset is in a `Destroying` state.
         *
         * Due to weight restrictions, this function may need to be called multiple times to fully
         * destroy all approvals. It will destroy `RemoveItemsLimit` approvals at a time.
         *
         * - `id`: The identifier of the asset to be destroyed. This must identify an existing
         * asset.
         *
         * Each call emits the `Event::DestroyedApprovals` event.
         */
        destroy_approvals: TxDescriptor<Anonymize<Ic5b47dj4coa3r>>;
        /**
         * Complete destroying asset and unreserve currency.
         *
         * `finish_destroy` should only be called after `start_destroy` has been called, and the
         * asset is in a `Destroying` state. All accounts or approvals should be destroyed before
         * hand.
         *
         * - `id`: The identifier of the asset to be destroyed. This must identify an existing
         * asset.
         *
         * Each successful call emits the `Event::Destroyed` event.
         */
        finish_destroy: TxDescriptor<Anonymize<Ic5b47dj4coa3r>>;
        /**
         * Mint assets of a particular class.
         *
         * The origin must be Signed and the sender must be the Issuer of the asset `id`.
         *
         * - `id`: The identifier of the asset to have some amount minted.
         * - `beneficiary`: The account to be credited with the minted assets.
         * - `amount`: The amount of the asset to be minted.
         *
         * Emits `Issued` event when successful.
         *
         * Weight: `O(1)`
         * Modes: Pre-existing balance of `beneficiary`; Account pre-existence of `beneficiary`.
         */
        mint: TxDescriptor<Anonymize<Ib3qnc19gu633c>>;
        /**
         * Reduce the balance of `who` by as much as possible up to `amount` assets of `id`.
         *
         * Origin must be Signed and the sender should be the Manager of the asset `id`.
         *
         * Bails with `NoAccount` if the `who` is already dead.
         *
         * - `id`: The identifier of the asset to have some amount burned.
         * - `who`: The account to be debited from.
         * - `amount`: The maximum amount by which `who`'s balance should be reduced.
         *
         * Emits `Burned` with the actual amount burned. If this takes the balance to below the
         * minimum for the asset, then the amount burned is increased to take it to zero.
         *
         * Weight: `O(1)`
         * Modes: Post-existence of `who`; Pre & post Zombie-status of `who`.
         */
        burn: TxDescriptor<Anonymize<Ifira6u9hi7cu1>>;
        /**
         * Move some assets from the sender account to another.
         *
         * Origin must be Signed.
         *
         * - `id`: The identifier of the asset to have some amount transferred.
         * - `target`: The account to be credited.
         * - `amount`: The amount by which the sender's balance of assets should be reduced and
         * `target`'s balance increased. The amount actually transferred may be slightly greater in
         * the case that the transfer would otherwise take the sender balance above zero but below
         * the minimum balance. Must be greater than zero.
         *
         * Emits `Transferred` with the actual amount transferred. If this takes the source balance
         * to below the minimum for the asset, then the amount transferred is increased to take it
         * to zero.
         *
         * Weight: `O(1)`
         * Modes: Pre-existence of `target`; Post-existence of sender; Account pre-existence of
         * `target`.
         */
        transfer: TxDescriptor<Anonymize<I72tqocvdoqfff>>;
        /**
         * Move some assets from the sender account to another, keeping the sender account alive.
         *
         * Origin must be Signed.
         *
         * - `id`: The identifier of the asset to have some amount transferred.
         * - `target`: The account to be credited.
         * - `amount`: The amount by which the sender's balance of assets should be reduced and
         * `target`'s balance increased. The amount actually transferred may be slightly greater in
         * the case that the transfer would otherwise take the sender balance above zero but below
         * the minimum balance. Must be greater than zero.
         *
         * Emits `Transferred` with the actual amount transferred. If this takes the source balance
         * to below the minimum for the asset, then the amount transferred is increased to take it
         * to zero.
         *
         * Weight: `O(1)`
         * Modes: Pre-existence of `target`; Post-existence of sender; Account pre-existence of
         * `target`.
         */
        transfer_keep_alive: TxDescriptor<Anonymize<I72tqocvdoqfff>>;
        /**
         * Move some assets from one account to another.
         *
         * Origin must be Signed and the sender should be the Admin of the asset `id`.
         *
         * - `id`: The identifier of the asset to have some amount transferred.
         * - `source`: The account to be debited.
         * - `dest`: The account to be credited.
         * - `amount`: The amount by which the `source`'s balance of assets should be reduced and
         * `dest`'s balance increased. The amount actually transferred may be slightly greater in
         * the case that the transfer would otherwise take the `source` balance above zero but
         * below the minimum balance. Must be greater than zero.
         *
         * Emits `Transferred` with the actual amount transferred. If this takes the source balance
         * to below the minimum for the asset, then the amount transferred is increased to take it
         * to zero.
         *
         * Weight: `O(1)`
         * Modes: Pre-existence of `dest`; Post-existence of `source`; Account pre-existence of
         * `dest`.
         */
        force_transfer: TxDescriptor<Anonymize<I2i27f3sfmvc05>>;
        /**
         * Disallow further unprivileged transfers of an asset `id` from an account `who`. `who`
         * must already exist as an entry in `Account`s of the asset. If you want to freeze an
         * account that does not have an entry, use `touch_other` first.
         *
         * Origin must be Signed and the sender should be the Freezer of the asset `id`.
         *
         * - `id`: The identifier of the asset to be frozen.
         * - `who`: The account to be frozen.
         *
         * Emits `Frozen`.
         *
         * Weight: `O(1)`
         */
        freeze: TxDescriptor<Anonymize<I1nlrtd1epki2d>>;
        /**
         * Allow unprivileged transfers to and from an account again.
         *
         * Origin must be Signed and the sender should be the Admin of the asset `id`.
         *
         * - `id`: The identifier of the asset to be frozen.
         * - `who`: The account to be unfrozen.
         *
         * Emits `Thawed`.
         *
         * Weight: `O(1)`
         */
        thaw: TxDescriptor<Anonymize<I1nlrtd1epki2d>>;
        /**
         * Disallow further unprivileged transfers for the asset class.
         *
         * Origin must be Signed and the sender should be the Freezer of the asset `id`.
         *
         * - `id`: The identifier of the asset to be frozen.
         *
         * Emits `Frozen`.
         *
         * Weight: `O(1)`
         */
        freeze_asset: TxDescriptor<Anonymize<Ic5b47dj4coa3r>>;
        /**
         * Allow unprivileged transfers for the asset again.
         *
         * Origin must be Signed and the sender should be the Admin of the asset `id`.
         *
         * - `id`: The identifier of the asset to be thawed.
         *
         * Emits `Thawed`.
         *
         * Weight: `O(1)`
         */
        thaw_asset: TxDescriptor<Anonymize<Ic5b47dj4coa3r>>;
        /**
         * Change the Owner of an asset.
         *
         * Origin must be Signed and the sender should be the Owner of the asset `id`.
         *
         * - `id`: The identifier of the asset.
         * - `owner`: The new Owner of this asset.
         *
         * Emits `OwnerChanged`.
         *
         * Weight: `O(1)`
         */
        transfer_ownership: TxDescriptor<Anonymize<I3abtumcmempjs>>;
        /**
         * Change the Issuer, Admin and Freezer of an asset.
         *
         * Origin must be Signed and the sender should be the Owner of the asset `id`.
         *
         * - `id`: The identifier of the asset to be frozen.
         * - `issuer`: The new Issuer of this asset.
         * - `admin`: The new Admin of this asset.
         * - `freezer`: The new Freezer of this asset.
         *
         * Emits `TeamChanged`.
         *
         * Weight: `O(1)`
         */
        set_team: TxDescriptor<Anonymize<Id81m8flopt8ha>>;
        /**
         * Set the metadata for an asset.
         *
         * Origin must be Signed and the sender should be the Owner of the asset `id`.
         *
         * Funds of sender are reserved according to the formula:
         * `MetadataDepositBase + MetadataDepositPerByte * (name.len + symbol.len)` taking into
         * account any already reserved funds.
         *
         * - `id`: The identifier of the asset to update.
         * - `name`: The user friendly name of this asset. Limited in length by `StringLimit`.
         * - `symbol`: The exchange symbol for this asset. Limited in length by `StringLimit`.
         * - `decimals`: The number of decimals this asset uses to represent one unit.
         *
         * Emits `MetadataSet`.
         *
         * Weight: `O(1)`
         */
        set_metadata: TxDescriptor<Anonymize<I8hff7chabggkd>>;
        /**
         * Clear the metadata for an asset.
         *
         * Origin must be Signed and the sender should be the Owner of the asset `id`.
         *
         * Any deposit is freed for the asset owner.
         *
         * - `id`: The identifier of the asset to clear.
         *
         * Emits `MetadataCleared`.
         *
         * Weight: `O(1)`
         */
        clear_metadata: TxDescriptor<Anonymize<Ic5b47dj4coa3r>>;
        /**
         * Force the metadata for an asset to some value.
         *
         * Origin must be ForceOrigin.
         *
         * Any deposit is left alone.
         *
         * - `id`: The identifier of the asset to update.
         * - `name`: The user friendly name of this asset. Limited in length by `StringLimit`.
         * - `symbol`: The exchange symbol for this asset. Limited in length by `StringLimit`.
         * - `decimals`: The number of decimals this asset uses to represent one unit.
         *
         * Emits `MetadataSet`.
         *
         * Weight: `O(N + S)` where N and S are the length of the name and symbol respectively.
         */
        force_set_metadata: TxDescriptor<Anonymize<I49i39mtj1ivbs>>;
        /**
         * Clear the metadata for an asset.
         *
         * Origin must be ForceOrigin.
         *
         * Any deposit is returned.
         *
         * - `id`: The identifier of the asset to clear.
         *
         * Emits `MetadataCleared`.
         *
         * Weight: `O(1)`
         */
        force_clear_metadata: TxDescriptor<Anonymize<Ic5b47dj4coa3r>>;
        /**
         * Alter the attributes of a given asset.
         *
         * Origin must be `ForceOrigin`.
         *
         * - `id`: The identifier of the asset.
         * - `owner`: The new Owner of this asset.
         * - `issuer`: The new Issuer of this asset.
         * - `admin`: The new Admin of this asset.
         * - `freezer`: The new Freezer of this asset.
         * - `min_balance`: The minimum balance of this new asset that any single account must
         * have. If an account's balance is reduced below this, then it collapses to zero.
         * - `is_sufficient`: Whether a non-zero balance of this asset is deposit of sufficient
         * value to account for the state bloat associated with its balance storage. If set to
         * `true`, then non-zero balances may be stored without a `consumer` reference (and thus
         * an ED in the Balances pallet or whatever else is used to control user-account state
         * growth).
         * - `is_frozen`: Whether this asset class is frozen except for permissioned/admin
         * instructions.
         *
         * Emits `AssetStatusChanged` with the identity of the asset.
         *
         * Weight: `O(1)`
         */
        force_asset_status: TxDescriptor<Anonymize<Ifkr2kcak2vto1>>;
        /**
         * Approve an amount of asset for transfer by a delegated third-party account.
         *
         * Origin must be Signed.
         *
         * Ensures that `ApprovalDeposit` worth of `Currency` is reserved from signing account
         * for the purpose of holding the approval. If some non-zero amount of assets is already
         * approved from signing account to `delegate`, then it is topped up or unreserved to
         * meet the right value.
         *
         * NOTE: The signing account does not need to own `amount` of assets at the point of
         * making this call.
         *
         * - `id`: The identifier of the asset.
         * - `delegate`: The account to delegate permission to transfer asset.
         * - `amount`: The amount of asset that may be transferred by `delegate`. If there is
         * already an approval in place, then this acts additively.
         *
         * Emits `ApprovedTransfer` on success.
         *
         * Weight: `O(1)`
         */
        approve_transfer: TxDescriptor<Anonymize<I1ju6r8q0cs9jt>>;
        /**
         * Cancel all of some asset approved for delegated transfer by a third-party account.
         *
         * Origin must be Signed and there must be an approval in place between signer and
         * `delegate`.
         *
         * Unreserves any deposit previously reserved by `approve_transfer` for the approval.
         *
         * - `id`: The identifier of the asset.
         * - `delegate`: The account delegated permission to transfer asset.
         *
         * Emits `ApprovalCancelled` on success.
         *
         * Weight: `O(1)`
         */
        cancel_approval: TxDescriptor<Anonymize<I4kpeq6j7cd5bu>>;
        /**
         * Cancel all of some asset approved for delegated transfer by a third-party account.
         *
         * Origin must be either ForceOrigin or Signed origin with the signer being the Admin
         * account of the asset `id`.
         *
         * Unreserves any deposit previously reserved by `approve_transfer` for the approval.
         *
         * - `id`: The identifier of the asset.
         * - `delegate`: The account delegated permission to transfer asset.
         *
         * Emits `ApprovalCancelled` on success.
         *
         * Weight: `O(1)`
         */
        force_cancel_approval: TxDescriptor<Anonymize<I5na1ka76k6811>>;
        /**
         * Transfer some asset balance from a previously delegated account to some third-party
         * account.
         *
         * Origin must be Signed and there must be an approval in place by the `owner` to the
         * signer.
         *
         * If the entire amount approved for transfer is transferred, then any deposit previously
         * reserved by `approve_transfer` is unreserved.
         *
         * - `id`: The identifier of the asset.
         * - `owner`: The account which previously approved for a transfer of at least `amount` and
         * from which the asset balance will be withdrawn.
         * - `destination`: The account to which the asset balance of `amount` will be transferred.
         * - `amount`: The amount of assets to transfer.
         *
         * Emits `TransferredApproved` on success.
         *
         * Weight: `O(1)`
         */
        transfer_approved: TxDescriptor<Anonymize<I59mhdb9omdqfa>>;
        /**
         * Create an asset account for non-provider assets.
         *
         * A deposit will be taken from the signer account.
         *
         * - `origin`: Must be Signed; the signer account must have sufficient funds for a deposit
         * to be taken.
         * - `id`: The identifier of the asset for the account to be created.
         *
         * Emits `Touched` event when successful.
         */
        touch: TxDescriptor<Anonymize<Ic5b47dj4coa3r>>;
        /**
         * Return the deposit (if any) of an asset account or a consumer reference (if any) of an
         * account.
         *
         * The origin must be Signed.
         *
         * - `id`: The identifier of the asset for which the caller would like the deposit
         * refunded.
         * - `allow_burn`: If `true` then assets may be destroyed in order to complete the refund.
         *
         * It will fail with either [`Error::ContainsHolds`] or [`Error::ContainsFreezes`] if
         * the asset account contains holds or freezes in place.
         *
         * Emits `Refunded` event when successful.
         */
        refund: TxDescriptor<Anonymize<I9vl5kpk0fpakt>>;
        /**
         * Sets the minimum balance of an asset.
         *
         * Only works if there aren't any accounts that are holding the asset or if
         * the new value of `min_balance` is less than the old one.
         *
         * Origin must be Signed and the sender has to be the Owner of the
         * asset `id`.
         *
         * - `id`: The identifier of the asset.
         * - `min_balance`: The new value of `min_balance`.
         *
         * Emits `AssetMinBalanceChanged` event when successful.
         */
        set_min_balance: TxDescriptor<Anonymize<I717jt61hu19b4>>;
        /**
         * Create an asset account for `who`.
         *
         * A deposit will be taken from the signer account.
         *
         * - `origin`: Must be Signed by `Freezer` or `Admin` of the asset `id`; the signer account
         * must have sufficient funds for a deposit to be taken.
         * - `id`: The identifier of the asset for the account to be created.
         * - `who`: The account to be created.
         *
         * Emits `Touched` event when successful.
         */
        touch_other: TxDescriptor<Anonymize<I1nlrtd1epki2d>>;
        /**
         * Return the deposit (if any) of a target asset account. Useful if you are the depositor.
         *
         * The origin must be Signed and either the account owner, depositor, or asset `Admin`. In
         * order to burn a non-zero balance of the asset, the caller must be the account and should
         * use `refund`.
         *
         * - `id`: The identifier of the asset for the account holding a deposit.
         * - `who`: The account to refund.
         *
         * It will fail with either [`Error::ContainsHolds`] or [`Error::ContainsFreezes`] if
         * the asset account contains holds or freezes in place.
         *
         * Emits `Refunded` event when successful.
         */
        refund_other: TxDescriptor<Anonymize<I1nlrtd1epki2d>>;
        /**
         * Disallow further unprivileged transfers of an asset `id` to and from an account `who`.
         *
         * Origin must be Signed and the sender should be the Freezer of the asset `id`.
         *
         * - `id`: The identifier of the account's asset.
         * - `who`: The account to be unblocked.
         *
         * Emits `Blocked`.
         *
         * Weight: `O(1)`
         */
        block: TxDescriptor<Anonymize<I1nlrtd1epki2d>>;
        /**
         * Transfer the entire transferable balance from the caller asset account.
         *
         * NOTE: This function only attempts to transfer _transferable_ balances. This means that
         * any held, frozen, or minimum balance (when `keep_alive` is `true`), will not be
         * transferred by this function. To ensure that this function results in a killed account,
         * you might need to prepare the account by removing any reference counters, storage
         * deposits, etc...
         *
         * The dispatch origin of this call must be Signed.
         *
         * - `id`: The identifier of the asset for the account holding a deposit.
         * - `dest`: The recipient of the transfer.
         * - `keep_alive`: A boolean to determine if the `transfer_all` operation should send all
         * of the funds the asset account has, causing the sender asset account to be killed
         * (false), or transfer everything except at least the minimum balance, which will
         * guarantee to keep the sender asset account alive (true).
         */
        transfer_all: TxDescriptor<Anonymize<I7f7v8192r1lmq>>;
    };
    Revive: {
        /**
         * A raw EVM transaction, typically dispatched by an Ethereum JSON-RPC server.
         *
         * # Parameters
         *
         * * `payload`: The encoded [`crate::evm::TransactionSigned`].
         * * `gas_limit`: The gas limit enforced during contract execution.
         * * `storage_deposit_limit`: The maximum balance that can be charged to the caller for
         * storage usage.
         *
         * # Note
         *
         * This call cannot be dispatched directly; attempting to do so will result in a failed
         * transaction. It serves as a wrapper for an Ethereum transaction. When submitted, the
         * runtime converts it into a [`sp_runtime::generic::CheckedExtrinsic`] by recovering the
         * signer and validating the transaction.
         */
        eth_transact: TxDescriptor<Anonymize<Ida37oe44osb06>>;
        /**
         * Makes a call to an account, optionally transferring some balance.
         *
         * # Parameters
         *
         * * `dest`: Address of the contract to call.
         * * `value`: The balance to transfer from the `origin` to `dest`.
         * * `gas_limit`: The gas limit enforced when executing the constructor.
         * * `storage_deposit_limit`: The maximum amount of balance that can be charged from the
         * caller to pay for the storage consumed.
         * * `data`: The input data to pass to the contract.
         *
         * * If the account is a smart-contract account, the associated code will be
         * executed and any value will be transferred.
         * * If the account is a regular account, any value will be transferred.
         * * If no account exists and the call value is not less than `existential_deposit`,
         * a regular account will be created and any value will be transferred.
         */
        call: TxDescriptor<Anonymize<Idsg8aod8e8fqn>>;
        /**
         * Instantiates a contract from a previously deployed wasm binary.
         *
         * This function is identical to [`Self::instantiate_with_code`] but without the
         * code deployment step. Instead, the `code_hash` of an on-chain deployed wasm binary
         * must be supplied.
         */
        instantiate: TxDescriptor<Anonymize<I46nktn22m6hbi>>;
        /**
         * Instantiates a new contract from the supplied `code` optionally transferring
         * some balance.
         *
         * This dispatchable has the same effect as calling [`Self::upload_code`] +
         * [`Self::instantiate`]. Bundling them together provides efficiency gains. Please
         * also check the documentation of [`Self::upload_code`].
         *
         * # Parameters
         *
         * * `value`: The balance to transfer from the `origin` to the newly created contract.
         * * `gas_limit`: The gas limit enforced when executing the constructor.
         * * `storage_deposit_limit`: The maximum amount of balance that can be charged/reserved
         * from the caller to pay for the storage consumed.
         * * `code`: The contract code to deploy in raw bytes.
         * * `data`: The input data to pass to the contract constructor.
         * * `salt`: Used for the address derivation. If `Some` is supplied then `CREATE2`
         * semantics are used. If `None` then `CRATE1` is used.
         *
         *
         * Instantiation is executed as follows:
         *
         * - The supplied `code` is deployed, and a `code_hash` is created for that code.
         * - If the `code_hash` already exists on the chain the underlying `code` will be shared.
         * - The destination address is computed based on the sender, code_hash and the salt.
         * - The smart-contract account is created at the computed address.
         * - The `value` is transferred to the new account.
         * - The `deploy` function is executed in the context of the newly-created account.
         */
        instantiate_with_code: TxDescriptor<Anonymize<Ibgj1cthra7lte>>;
        /**
         * Upload new `code` without instantiating a contract from it.
         *
         * If the code does not already exist a deposit is reserved from the caller
         * and unreserved only when [`Self::remove_code`] is called. The size of the reserve
         * depends on the size of the supplied `code`.
         *
         * # Note
         *
         * Anyone can instantiate a contract from any uploaded code and thus prevent its removal.
         * To avoid this situation a constructor could employ access control so that it can
         * only be instantiated by permissioned entities. The same is true when uploading
         * through [`Self::instantiate_with_code`].
         */
        upload_code: TxDescriptor<Anonymize<I10ra4g1rl6k2f>>;
        /**
         * Remove the code stored under `code_hash` and refund the deposit to its owner.
         *
         * A code can only be removed by its original uploader (its owner) and only if it is
         * not used by any contract.
         */
        remove_code: TxDescriptor<Anonymize<Ib51vk42m1po4n>>;
        /**
         * Privileged function that changes the code of an existing contract.
         *
         * This takes care of updating refcounts and all other necessary operations. Returns
         * an error if either the `code_hash` or `dest` do not exist.
         *
         * # Note
         *
         * This does **not** change the address of the contract in question. This means
         * that the contract address is no longer derived from its code hash after calling
         * this dispatchable.
         */
        set_code: TxDescriptor<Anonymize<I1uihehkdsggvp>>;
        /**
         * Register the callers account id so that it can be used in contract interactions.
         *
         * This will error if the origin is already mapped or is a eth native `Address20`. It will
         * take a deposit that can be released by calling [`Self::unmap_account`].
         */
        map_account: TxDescriptor<undefined>;
        /**
         * Unregister the callers account id in order to free the deposit.
         *
         * There is no reason to ever call this function other than freeing up the deposit.
         * This is only useful when the account should no longer be used.
         */
        unmap_account: TxDescriptor<undefined>;
        /**
         * Dispatch an `call` with the origin set to the callers fallback address.
         *
         * Every `AccountId32` can control its corresponding fallback account. The fallback account
         * is the `AccountId20` with the last 12 bytes set to `0xEE`. This is essentially a
         * recovery function in case an `AccountId20` was used without creating a mapping first.
         */
        dispatch_as_fallback_account: TxDescriptor<Anonymize<I65k89p01c7fcj>>;
    };
    Fungibles: {
        /**
         * Transfers `value` amount of tokens from the caller's account to account `to`.
         *
         * # Parameters
         * - `token` - The token to transfer.
         * - `to` - The recipient account.
         * - `value` - The number of tokens to transfer.
         */
        transfer: TxDescriptor<Anonymize<I9tbfhd14k3gir>>;
        /**
         * Transfers `value` amount tokens on behalf of `from` to account `to` with additional
         * `data` in unspecified format.
         *
         * # Parameters
         * - `token` - The token to transfer.
         * - `from` - The account from which the token balance will be withdrawn.
         * - `to` - The recipient account.
         * - `value` - The number of tokens to transfer.
         */
        transfer_from: TxDescriptor<Anonymize<I7skr1ar9c2b3r>>;
        /**
         * Approves `spender` to spend `value` amount of tokens on behalf of the caller.
         *
         * # Parameters
         * - `token` - The token to approve.
         * - `spender` - The account that is allowed to spend the tokens.
         * - `value` - The number of tokens to approve.
         */
        approve: TxDescriptor<Anonymize<Iersu5s46p8jg1>>;
        /**
         * Increases the allowance of `spender` by `value` amount of tokens.
         *
         * # Parameters
         * - `token` - The token to have an allowance increased.
         * - `spender` - The account that is allowed to spend the tokens.
         * - `value` - The number of tokens to increase the allowance by.
         */
        increase_allowance: TxDescriptor<Anonymize<Iersu5s46p8jg1>>;
        /**
         * Decreases the allowance of `spender` by `value` amount of tokens.
         *
         * # Parameters
         * - `token` - The token to have an allowance decreased.
         * - `spender` - The account that is allowed to spend the tokens.
         * - `value` - The number of tokens to decrease the allowance by.
         */
        decrease_allowance: TxDescriptor<Anonymize<Iersu5s46p8jg1>>;
        /**
         * Create a new token with a given identifier.
         *
         * # Parameters
         * - `id` - The identifier of the token.
         * - `admin` - The account that will administer the token.
         * - `min_balance` - The minimum balance required for accounts holding this token.
         */
        create: TxDescriptor<Anonymize<I2obi88g7eeev0>>;
        /**
         * Start the process of destroying a token.
         *
         * # Parameters
         * - `token` - The token to be destroyed.
         */
        start_destroy: TxDescriptor<Anonymize<I1rvj8qc6u04i2>>;
        /**
         * Set the metadata for a token.
         *
         * # Parameters
         * - `token`: The token to update.
         * - `name`: The user friendly name of this token.
         * - `symbol`: The exchange symbol for this token.
         * - `decimals`: The number of decimals this token uses to represent one unit.
         */
        set_metadata: TxDescriptor<Anonymize<I7m4m3sn3ouhp0>>;
        /**
         * Clear the metadata for a token.
         *
         * # Parameters
         * - `token` - The token to update.
         */
        clear_metadata: TxDescriptor<Anonymize<I1rvj8qc6u04i2>>;
        /**
         * Creates `value` amount of tokens and assigns them to `account`, increasing the total
         * supply.
         *
         * # Parameters
         * - `token` - The token to mint.
         * - `account` - The account to be credited with the created tokens.
         * - `value` - The number of tokens to mint.
         */
        mint: TxDescriptor<Anonymize<Ifiphvnhbdlk4m>>;
        /**
         * Destroys `value` amount of tokens from `account`, reducing the total supply.
         *
         * # Parameters
         * - `token` - the token to burn.
         * - `account` - The account from which the tokens will be destroyed.
         * - `value` - The number of tokens to destroy.
         */
        burn: TxDescriptor<Anonymize<Ifiphvnhbdlk4m>>;
    };
    Messaging: {
        /**
        
         */
        send: TxDescriptor<Anonymize<I4ov6e94l79mbg>>;
        /**
        
         */
        ismp_get: TxDescriptor<Anonymize<I21mg138mq0dm1>>;
        /**
        
         */
        ismp_post: TxDescriptor<Anonymize<Ibcgh77idehr6f>>;
        /**
        
         */
        xcm_new_query: TxDescriptor<Anonymize<Ia72crscsnehc6>>;
        /**
        
         */
        xcm_response: TxDescriptor<Anonymize<Iasr6pj6shs0fl>>;
        /**
        
         */
        remove: TxDescriptor<Anonymize<I3iv5pqub2hu31>>;
    };
};
type IEvent = {
    System: {
        /**
         * An extrinsic completed successfully.
         */
        ExtrinsicSuccess: PlainDescriptor<Anonymize<Ia82mnkmeo2rhc>>;
        /**
         * An extrinsic failed.
         */
        ExtrinsicFailed: PlainDescriptor<Anonymize<Ib45rihle5v6ft>>;
        /**
         * `:code` was updated.
         */
        CodeUpdated: PlainDescriptor<undefined>;
        /**
         * A new account was created.
         */
        NewAccount: PlainDescriptor<Anonymize<Icbccs0ug47ilf>>;
        /**
         * An account was reaped.
         */
        KilledAccount: PlainDescriptor<Anonymize<Icbccs0ug47ilf>>;
        /**
         * On on-chain remark happened.
         */
        Remarked: PlainDescriptor<Anonymize<I855j4i3kr8ko1>>;
        /**
         * An upgrade was authorized.
         */
        UpgradeAuthorized: PlainDescriptor<Anonymize<Ie8n59eevgkj87>>;
        /**
         * An invalid authorized upgrade was rejected while trying to apply it.
         */
        RejectedInvalidAuthorizedUpgrade: PlainDescriptor<Anonymize<I2bfi6omkospl3>>;
    };
    ParachainSystem: {
        /**
         * The validation function has been scheduled to apply.
         */
        ValidationFunctionStored: PlainDescriptor<undefined>;
        /**
         * The validation function was applied as of the contained relay chain block number.
         */
        ValidationFunctionApplied: PlainDescriptor<Anonymize<Idd7hd99u0ho0n>>;
        /**
         * The relay-chain aborted the upgrade process.
         */
        ValidationFunctionDiscarded: PlainDescriptor<undefined>;
        /**
         * Some downward messages have been received and will be processed.
         */
        DownwardMessagesReceived: PlainDescriptor<Anonymize<Iafscmv8tjf0ou>>;
        /**
         * Downward messages were processed using the given weight.
         */
        DownwardMessagesProcessed: PlainDescriptor<Anonymize<I100l07kaehdlp>>;
        /**
         * An upward message was sent to the relay chain.
         */
        UpwardMessageSent: PlainDescriptor<Anonymize<I6gnbnvip5vvdi>>;
    };
    MultiBlockMigrations: {
        /**
         * A Runtime upgrade started.
         *
         * Its end is indicated by `UpgradeCompleted` or `UpgradeFailed`.
         */
        UpgradeStarted: PlainDescriptor<Anonymize<If1co0pilmi7oq>>;
        /**
         * The current runtime upgrade completed.
         *
         * This implies that all of its migrations completed successfully as well.
         */
        UpgradeCompleted: PlainDescriptor<undefined>;
        /**
         * Runtime upgrade failed.
         *
         * This is very bad and will require governance intervention.
         */
        UpgradeFailed: PlainDescriptor<undefined>;
        /**
         * A migration was skipped since it was already executed in the past.
         */
        MigrationSkipped: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
        /**
         * A migration progressed.
         */
        MigrationAdvanced: PlainDescriptor<Anonymize<Iae74gjak1qibn>>;
        /**
         * A Migration completed.
         */
        MigrationCompleted: PlainDescriptor<Anonymize<Iae74gjak1qibn>>;
        /**
         * A Migration failed.
         *
         * This implies that the whole upgrade failed and governance intervention is required.
         */
        MigrationFailed: PlainDescriptor<Anonymize<Iae74gjak1qibn>>;
        /**
         * The set of historical migrations has been cleared.
         */
        HistoricCleared: PlainDescriptor<Anonymize<I3escdojpj0551>>;
    };
    Balances: {
        /**
         * An account was created with some free balance.
         */
        Endowed: PlainDescriptor<Anonymize<Icv68aq8841478>>;
        /**
         * An account was removed whose balance was non-zero but below ExistentialDeposit,
         * resulting in an outright loss.
         */
        DustLost: PlainDescriptor<Anonymize<Ic262ibdoec56a>>;
        /**
         * Transfer succeeded.
         */
        Transfer: PlainDescriptor<Anonymize<Iflcfm9b6nlmdd>>;
        /**
         * A balance was set by root.
         */
        BalanceSet: PlainDescriptor<Anonymize<Ijrsf4mnp3eka>>;
        /**
         * Some balance was reserved (moved from free to reserved).
         */
        Reserved: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some balance was unreserved (moved from reserved to free).
         */
        Unreserved: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some balance was moved from the reserve of the first account to the second account.
         * Final argument indicates the destination balance type.
         */
        ReserveRepatriated: PlainDescriptor<Anonymize<I8tjvj9uq4b7hi>>;
        /**
         * Some amount was deposited (e.g. for transaction fees).
         */
        Deposit: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some amount was withdrawn from the account (e.g. for transaction fees).
         */
        Withdraw: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some amount was removed from the account (e.g. for misbehavior).
         */
        Slashed: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some amount was minted into an account.
         */
        Minted: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some amount was burned from an account.
         */
        Burned: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some amount was suspended from an account (it can be restored later).
         */
        Suspended: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some amount was restored into an account.
         */
        Restored: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * An account was upgraded.
         */
        Upgraded: PlainDescriptor<Anonymize<I4cbvqmqadhrea>>;
        /**
         * Total issuance was increased by `amount`, creating a credit to be balanced.
         */
        Issued: PlainDescriptor<Anonymize<I3qt1hgg4djhgb>>;
        /**
         * Total issuance was decreased by `amount`, creating a debt to be balanced.
         */
        Rescinded: PlainDescriptor<Anonymize<I3qt1hgg4djhgb>>;
        /**
         * Some balance was locked.
         */
        Locked: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some balance was unlocked.
         */
        Unlocked: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some balance was frozen.
         */
        Frozen: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * Some balance was thawed.
         */
        Thawed: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
        /**
         * The `TotalIssuance` was forcefully changed.
         */
        TotalIssuanceForced: PlainDescriptor<Anonymize<I4fooe9dun9o0t>>;
    };
    TransactionPayment: {
        /**
         * A transaction fee `actual_fee`, of which `tip` was added to the minimum inclusion fee,
         * has been paid by `who`.
         */
        TransactionFeePaid: PlainDescriptor<Anonymize<Ier2cke86dqbr2>>;
    };
    Treasury: {
        /**
         * We have ended a spend period and will now allocate funds.
         */
        Spending: PlainDescriptor<Anonymize<I8iksqi3eani0a>>;
        /**
         * Some funds have been allocated.
         */
        Awarded: PlainDescriptor<Anonymize<I16enopmju1p0q>>;
        /**
         * Some of our funds have been burnt.
         */
        Burnt: PlainDescriptor<Anonymize<I43kq8qudg7pq9>>;
        /**
         * Spending has finished; this is the amount that rolls over until next spend.
         */
        Rollover: PlainDescriptor<Anonymize<I76riseemre533>>;
        /**
         * Some funds have been deposited.
         */
        Deposit: PlainDescriptor<Anonymize<Ie5v6njpckr05b>>;
        /**
         * A new spend proposal has been approved.
         */
        SpendApproved: PlainDescriptor<Anonymize<I38bmcrmh852rk>>;
        /**
         * The inactive funds of the pallet have been updated.
         */
        UpdatedInactive: PlainDescriptor<Anonymize<I4hcillge8de5f>>;
        /**
         * A new asset spend proposal has been approved.
         */
        AssetSpendApproved: PlainDescriptor<Anonymize<I8usdc6tg7829p>>;
        /**
         * An approved spend was voided.
         */
        AssetSpendVoided: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
        /**
         * A payment happened.
         */
        Paid: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
        /**
         * A payment failed and can be retried.
         */
        PaymentFailed: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
        /**
         * A spend was processed and removed from the storage. It might have been successfully
         * paid or it may have expired.
         */
        SpendProcessed: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
    };
    Sudo: {
        /**
         * A sudo call just took place.
         */
        Sudid: PlainDescriptor<Anonymize<I79tt57ecc1u8d>>;
        /**
         * The sudo key has been updated.
         */
        KeyChanged: PlainDescriptor<Anonymize<I5rtkmhm2dng4u>>;
        /**
         * The key was permanently removed.
         */
        KeyRemoved: PlainDescriptor<undefined>;
        /**
         * A [sudo_as](Pallet::sudo_as) call just took place.
         */
        SudoAsDone: PlainDescriptor<Anonymize<I79tt57ecc1u8d>>;
    };
    Council: {
        /**
         * A motion (given hash) has been proposed (by given account) with a threshold (given
         * `MemberCount`).
         */
        Proposed: PlainDescriptor<Anonymize<Ift6f10887nk72>>;
        /**
         * A motion (given hash) has been voted on by given account, leaving
         * a tally (yes votes and no votes given respectively as `MemberCount`).
         */
        Voted: PlainDescriptor<Anonymize<I7qc53b1tvqjg2>>;
        /**
         * A motion was approved by the required threshold.
         */
        Approved: PlainDescriptor<Anonymize<I2ev73t79f46tb>>;
        /**
         * A motion was not approved by the required threshold.
         */
        Disapproved: PlainDescriptor<Anonymize<I2ev73t79f46tb>>;
        /**
         * A motion was executed; result will be `Ok` if it returned without error.
         */
        Executed: PlainDescriptor<Anonymize<I6nu92s10o9433>>;
        /**
         * A single member did some action; result will be `Ok` if it returned without error.
         */
        MemberExecuted: PlainDescriptor<Anonymize<I6nu92s10o9433>>;
        /**
         * A proposal was closed because its threshold was reached or after its duration was up.
         */
        Closed: PlainDescriptor<Anonymize<Iak7fhrgb9jnnq>>;
        /**
         * A proposal was killed.
         */
        Killed: PlainDescriptor<Anonymize<I2ev73t79f46tb>>;
        /**
         * Some cost for storing a proposal was burned.
         */
        ProposalCostBurned: PlainDescriptor<Anonymize<I9ad1o9mv4cm3>>;
        /**
         * Some cost for storing a proposal was released.
         */
        ProposalCostReleased: PlainDescriptor<Anonymize<I9ad1o9mv4cm3>>;
    };
    Motion: {
        /**
         * A [SimpleMajorityOrigin] motion was executed. [motion_result] contains the call result
         */
        DispatchSimpleMajority: PlainDescriptor<Anonymize<Iek4p2kbgm2db2>>;
        /**
         * A [SuperMajorityOrigin] motion was executed. [motion_result] contains the call result
         */
        DispatchSuperMajority: PlainDescriptor<Anonymize<Iek4p2kbgm2db2>>;
        /**
         * A [UnanimousOrigin] motion was executed. [motion_result] contains the call result
         */
        DispatchUnanimous: PlainDescriptor<Anonymize<Iek4p2kbgm2db2>>;
    };
    CollatorSelection: {
        /**
         * New Invulnerables were set.
         */
        NewInvulnerables: PlainDescriptor<Anonymize<I39t01nnod9109>>;
        /**
         * A new Invulnerable was added.
         */
        InvulnerableAdded: PlainDescriptor<Anonymize<I6v8sm60vvkmk7>>;
        /**
         * An Invulnerable was removed.
         */
        InvulnerableRemoved: PlainDescriptor<Anonymize<I6v8sm60vvkmk7>>;
        /**
         * The number of desired candidates was set.
         */
        NewDesiredCandidates: PlainDescriptor<Anonymize<I1qmtmbe5so8r3>>;
        /**
         * The candidacy bond was set.
         */
        NewCandidacyBond: PlainDescriptor<Anonymize<Ih99m6ehpcar7>>;
        /**
         * A new candidate joined.
         */
        CandidateAdded: PlainDescriptor<Anonymize<Idgorhsbgdq2ap>>;
        /**
         * Bond of a candidate updated.
         */
        CandidateBondUpdated: PlainDescriptor<Anonymize<Idgorhsbgdq2ap>>;
        /**
         * A candidate was removed.
         */
        CandidateRemoved: PlainDescriptor<Anonymize<I6v8sm60vvkmk7>>;
        /**
         * An account was replaced in the candidate list by another one.
         */
        CandidateReplaced: PlainDescriptor<Anonymize<I9ubb2kqevnu6t>>;
        /**
         * An account was unable to be added to the Invulnerables because they did not have keys
         * registered. Other Invulnerables may have been set.
         */
        InvalidInvulnerableSkipped: PlainDescriptor<Anonymize<I6v8sm60vvkmk7>>;
    };
    Session: {
        /**
         * New session has happened. Note that the argument is the session index, not the
         * block number as the type might suggest.
         */
        NewSession: PlainDescriptor<Anonymize<I2hq50pu2kdjpo>>;
        /**
         * Validator has been disabled.
         */
        ValidatorDisabled: PlainDescriptor<Anonymize<I9acqruh7322g2>>;
        /**
         * Validator has been re-enabled.
         */
        ValidatorReenabled: PlainDescriptor<Anonymize<I9acqruh7322g2>>;
    };
    Scheduler: {
        /**
         * Scheduled some task.
         */
        Scheduled: PlainDescriptor<Anonymize<I5n4sebgkfr760>>;
        /**
         * Canceled some task.
         */
        Canceled: PlainDescriptor<Anonymize<I5n4sebgkfr760>>;
        /**
         * Dispatched some task.
         */
        Dispatched: PlainDescriptor<Anonymize<I8vb39n1b1sn86>>;
        /**
         * Set a retry configuration for some task.
         */
        RetrySet: PlainDescriptor<Anonymize<Ia3c82eadg79bj>>;
        /**
         * Cancel a retry configuration for some task.
         */
        RetryCancelled: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
        /**
         * The call for the provided hash was not found so the task has been aborted.
         */
        CallUnavailable: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
        /**
         * The given task was unable to be renewed since the agenda is full at that block.
         */
        PeriodicFailed: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
        /**
         * The given task was unable to be retried since the agenda is full at that block or there
         * was not enough weight to reschedule it.
         */
        RetryFailed: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
        /**
         * The given task can never be executed since it is overweight.
         */
        PermanentlyOverweight: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
        /**
         * Agenda is incomplete from `when`.
         */
        AgendaIncomplete: PlainDescriptor<Anonymize<Ibtsa3docbr9el>>;
    };
    Preimage: {
        /**
         * A preimage has been noted.
         */
        Noted: PlainDescriptor<Anonymize<I1jm8m1rh9e20v>>;
        /**
         * A preimage has been requested.
         */
        Requested: PlainDescriptor<Anonymize<I1jm8m1rh9e20v>>;
        /**
         * A preimage has ben cleared.
         */
        Cleared: PlainDescriptor<Anonymize<I1jm8m1rh9e20v>>;
    };
    XcmpQueue: {
        /**
         * An HRMP message was sent to a sibling parachain.
         */
        XcmpMessageSent: PlainDescriptor<Anonymize<I137t1cld92pod>>;
    };
    PolkadotXcm: {
        /**
         * Execution of an XCM message was attempted.
         */
        Attempted: PlainDescriptor<Anonymize<Ia72eet39sf8j9>>;
        /**
         * An XCM message was sent.
         */
        Sent: PlainDescriptor<Anonymize<I9t9l8gsr9gbhc>>;
        /**
         * An XCM message failed to send.
         */
        SendFailed: PlainDescriptor<Anonymize<Ibmuil6p3vl83l>>;
        /**
         * An XCM message failed to process.
         */
        ProcessXcmError: PlainDescriptor<Anonymize<I7lul91g50ae87>>;
        /**
         * Query response received which does not match a registered query. This may be because a
         * matching query was never registered, it may be because it is a duplicate response, or
         * because the query timed out.
         */
        UnexpectedResponse: PlainDescriptor<Anonymize<Icl7nl1rfeog3i>>;
        /**
         * Query response has been received and is ready for taking with `take_response`. There is
         * no registered notification call.
         */
        ResponseReady: PlainDescriptor<Anonymize<Iasr6pj6shs0fl>>;
        /**
         * Query response has been received and query is removed. The registered notification has
         * been dispatched and executed successfully.
         */
        Notified: PlainDescriptor<Anonymize<I2uqmls7kcdnii>>;
        /**
         * Query response has been received and query is removed. The registered notification
         * could not be dispatched because the dispatch weight is greater than the maximum weight
         * originally budgeted by this runtime for the query result.
         */
        NotifyOverweight: PlainDescriptor<Anonymize<Idg69klialbkb8>>;
        /**
         * Query response has been received and query is removed. There was a general error with
         * dispatching the notification call.
         */
        NotifyDispatchError: PlainDescriptor<Anonymize<I2uqmls7kcdnii>>;
        /**
         * Query response has been received and query is removed. The dispatch was unable to be
         * decoded into a `Call`; this might be due to dispatch function having a signature which
         * is not `(origin, QueryId, Response)`.
         */
        NotifyDecodeFailed: PlainDescriptor<Anonymize<I2uqmls7kcdnii>>;
        /**
         * Expected query response has been received but the origin location of the response does
         * not match that expected. The query remains registered for a later, valid, response to
         * be received and acted upon.
         */
        InvalidResponder: PlainDescriptor<Anonymize<I7r6b7145022pp>>;
        /**
         * Expected query response has been received but the expected origin location placed in
         * storage by this runtime previously cannot be decoded. The query remains registered.
         *
         * This is unexpected (since a location placed in storage in a previously executing
         * runtime should be readable prior to query timeout) and dangerous since the possibly
         * valid response will be dropped. Manual governance intervention is probably going to be
         * needed.
         */
        InvalidResponderVersion: PlainDescriptor<Anonymize<Icl7nl1rfeog3i>>;
        /**
         * Received query response has been read and removed.
         */
        ResponseTaken: PlainDescriptor<Anonymize<I30pg328m00nr3>>;
        /**
         * Some assets have been placed in an asset trap.
         */
        AssetsTrapped: PlainDescriptor<Anonymize<Icmrn7bogp28cs>>;
        /**
         * An XCM version change notification message has been attempted to be sent.
         *
         * The cost of sending it (borne by the chain) is included.
         */
        VersionChangeNotified: PlainDescriptor<Anonymize<I7m9b5plj4h5ot>>;
        /**
         * The supported version of a location has been changed. This might be through an
         * automatic notification or a manual intervention.
         */
        SupportedVersionChanged: PlainDescriptor<Anonymize<I9kt8c221c83ln>>;
        /**
         * A given location which had a version change subscription was dropped owing to an error
         * sending the notification to it.
         */
        NotifyTargetSendFail: PlainDescriptor<Anonymize<I9onhk772nfs4f>>;
        /**
         * A given location which had a version change subscription was dropped owing to an error
         * migrating the location to our new XCM format.
         */
        NotifyTargetMigrationFail: PlainDescriptor<Anonymize<I3l6bnksrmt56r>>;
        /**
         * Expected query response has been received but the expected querier location placed in
         * storage by this runtime previously cannot be decoded. The query remains registered.
         *
         * This is unexpected (since a location placed in storage in a previously executing
         * runtime should be readable prior to query timeout) and dangerous since the possibly
         * valid response will be dropped. Manual governance intervention is probably going to be
         * needed.
         */
        InvalidQuerierVersion: PlainDescriptor<Anonymize<Icl7nl1rfeog3i>>;
        /**
         * Expected query response has been received but the querier location of the response does
         * not match the expected. The query remains registered for a later, valid, response to
         * be received and acted upon.
         */
        InvalidQuerier: PlainDescriptor<Anonymize<Idh09k0l2pmdcg>>;
        /**
         * A remote has requested XCM version change notification from us and we have honored it.
         * A version information message is sent to them and its cost is included.
         */
        VersionNotifyStarted: PlainDescriptor<Anonymize<I7uoiphbm0tj4r>>;
        /**
         * We have requested that a remote chain send us XCM version change notifications.
         */
        VersionNotifyRequested: PlainDescriptor<Anonymize<I7uoiphbm0tj4r>>;
        /**
         * We have requested that a remote chain stops sending us XCM version change
         * notifications.
         */
        VersionNotifyUnrequested: PlainDescriptor<Anonymize<I7uoiphbm0tj4r>>;
        /**
         * Fees were paid from a location for an operation (often for using `SendXcm`).
         */
        FeesPaid: PlainDescriptor<Anonymize<I512p1n7qt24l8>>;
        /**
         * Some assets have been claimed from an asset trap
         */
        AssetsClaimed: PlainDescriptor<Anonymize<Icmrn7bogp28cs>>;
        /**
         * A XCM version migration finished.
         */
        VersionMigrationFinished: PlainDescriptor<Anonymize<I6s1nbislhk619>>;
        /**
         * An `aliaser` location was authorized by `target` to alias it, authorization valid until
         * `expiry` block number.
         */
        AliasAuthorized: PlainDescriptor<Anonymize<I3gghqnh2mj0is>>;
        /**
         * `target` removed alias authorization for `aliaser`.
         */
        AliasAuthorizationRemoved: PlainDescriptor<Anonymize<I6iv852roh6t3h>>;
        /**
         * `target` removed all alias authorizations.
         */
        AliasesAuthorizationsRemoved: PlainDescriptor<Anonymize<I9oc2o6itbiopq>>;
    };
    CumulusXcm: {
        /**
         * Downward message is invalid XCM.
         * \[ id \]
         */
        InvalidFormat: PlainDescriptor<FixedSizeBinary<32>>;
        /**
         * Downward message is unsupported version of XCM.
         * \[ id \]
         */
        UnsupportedVersion: PlainDescriptor<FixedSizeBinary<32>>;
        /**
         * Downward message executed with the given outcome.
         * \[ id, outcome \]
         */
        ExecutedDownward: PlainDescriptor<Anonymize<Ibeto40kl3r5j7>>;
    };
    MessageQueue: {
        /**
         * Message discarded due to an error in the `MessageProcessor` (usually a format error).
         */
        ProcessingFailed: PlainDescriptor<Anonymize<I1rvj4ubaplho0>>;
        /**
         * Message is processed.
         */
        Processed: PlainDescriptor<Anonymize<Ia3uu7lqcc1q1i>>;
        /**
         * Message placed in overweight queue.
         */
        OverweightEnqueued: PlainDescriptor<Anonymize<I7crucfnonitkn>>;
        /**
         * This page was reaped.
         */
        PageReaped: PlainDescriptor<Anonymize<I7tmrp94r9sq4n>>;
    };
    Ismp: {
        /**
         * Emitted when a state machine is successfully updated to a new height
         */
        StateMachineUpdated: PlainDescriptor<Anonymize<Icuomvkc5d2ldo>>;
        /**
         * Emitted when a state commitment is vetoed by a fisherman
         */
        StateCommitmentVetoed: PlainDescriptor<Anonymize<Imnb7a0a14ts1>>;
        /**
         * Indicates that a consensus client has been created
         */
        ConsensusClientCreated: PlainDescriptor<Anonymize<I9ljfa9qc631nt>>;
        /**
         * Indicates that a consensus client has been created
         */
        ConsensusClientFrozen: PlainDescriptor<Anonymize<I9ljfa9qc631nt>>;
        /**
         * An Outgoing Response has been deposited
         */
        Response: PlainDescriptor<Anonymize<I5ntoea33t507g>>;
        /**
         * An Outgoing Request has been deposited
         */
        Request: PlainDescriptor<Anonymize<Icvhvdg4guj0u2>>;
        /**
         * Some errors handling some ismp messages
         */
        Errors: PlainDescriptor<Anonymize<I6vqpfjes12rn2>>;
        /**
         * Post Request Handled
         */
        PostRequestHandled: PlainDescriptor<Anonymize<I7qo7cp2e3aerl>>;
        /**
         * Post Response Handled
         */
        PostResponseHandled: PlainDescriptor<Anonymize<I7qo7cp2e3aerl>>;
        /**
         * Get Response Handled
         */
        GetRequestHandled: PlainDescriptor<Anonymize<I7qo7cp2e3aerl>>;
        /**
         * Post request timeout handled
         */
        PostRequestTimeoutHandled: PlainDescriptor<Anonymize<I7hm2lpanae6vf>>;
        /**
         * Post response timeout handled
         */
        PostResponseTimeoutHandled: PlainDescriptor<Anonymize<I7hm2lpanae6vf>>;
        /**
         * Get request timeout handled
         */
        GetRequestTimeoutHandled: PlainDescriptor<Anonymize<I7hm2lpanae6vf>>;
    };
    IsmpParachain: {
        /**
         * Parachains with the `para_ids` have been added to the whitelist
         */
        ParachainsAdded: PlainDescriptor<Anonymize<Ivalbtb85o2h0>>;
        /**
         * Parachains with the `para_ids` have been removed from the whitelist
         */
        ParachainsRemoved: PlainDescriptor<Anonymize<Ic8hk838gccoml>>;
    };
    Contracts: {
        /**
         * Contract deployed by address at the specified address.
         */
        Instantiated: PlainDescriptor<Anonymize<Ie5222qfrr24ek>>;
        /**
         * Contract has been removed.
         *
         * # Note
         *
         * The only way for a contract to be removed and emitting this event is by calling
         * `seal_terminate`.
         */
        Terminated: PlainDescriptor<Anonymize<I28g8sphdu312k>>;
        /**
         * Code with the specified hash has been stored.
         */
        CodeStored: PlainDescriptor<Anonymize<Idqbjt2c6r46t6>>;
        /**
         * A custom event emitted by the contract.
         */
        ContractEmitted: PlainDescriptor<Anonymize<I853aigjva3f0t>>;
        /**
         * A code with the specified hash was removed.
         */
        CodeRemoved: PlainDescriptor<Anonymize<I9uehhems5hkqm>>;
        /**
         * A contract's code was updated.
         */
        ContractCodeUpdated: PlainDescriptor<Anonymize<I7q5qk4uoanhof>>;
        /**
         * A contract was called either by a plain account or another contract.
         *
         * # Note
         *
         * Please keep in mind that like all events this is only emitted for successful
         * calls. This is because on failure all storage changes including events are
         * rolled back.
         */
        Called: PlainDescriptor<Anonymize<Iehpbs40l3jkit>>;
        /**
         * A contract delegate called a code hash.
         *
         * # Note
         *
         * Please keep in mind that like all events this is only emitted for successful
         * calls. This is because on failure all storage changes including events are
         * rolled back.
         */
        DelegateCalled: PlainDescriptor<Anonymize<Idht9upmipvd4j>>;
        /**
         * Some funds have been transferred and held as storage deposit.
         */
        StorageDepositTransferredAndHeld: PlainDescriptor<Anonymize<Iflcfm9b6nlmdd>>;
        /**
         * Some storage deposit funds have been transferred and released.
         */
        StorageDepositTransferredAndReleased: PlainDescriptor<Anonymize<Iflcfm9b6nlmdd>>;
    };
    Proxy: {
        /**
         * A proxy was executed correctly, with the given.
         */
        ProxyExecuted: PlainDescriptor<Anonymize<Ieahie1iccmfd4>>;
        /**
         * A pure account has been created by new proxy with given
         * disambiguation index and proxy type.
         */
        PureCreated: PlainDescriptor<Anonymize<Ie7cuj84ohvg56>>;
        /**
         * An announcement was placed to make a call in the future.
         */
        Announced: PlainDescriptor<Anonymize<I2ur0oeqg495j8>>;
        /**
         * A proxy was added.
         */
        ProxyAdded: PlainDescriptor<Anonymize<I8ioopvokvl3ud>>;
        /**
         * A proxy was removed.
         */
        ProxyRemoved: PlainDescriptor<Anonymize<I8ioopvokvl3ud>>;
        /**
         * A deposit stored for proxies or announcements was poked / updated.
         */
        DepositPoked: PlainDescriptor<Anonymize<I1bhd210c3phjj>>;
    };
    Multisig: {
        /**
         * A new multisig operation has begun.
         */
        NewMultisig: PlainDescriptor<Anonymize<Iep27ialq4a7o7>>;
        /**
         * A multisig operation has been approved by someone.
         */
        MultisigApproval: PlainDescriptor<Anonymize<Iasu5jvoqr43mv>>;
        /**
         * A multisig operation has been executed.
         */
        MultisigExecuted: PlainDescriptor<Anonymize<I2n5q2h7q8c8g>>;
        /**
         * A multisig operation has been cancelled.
         */
        MultisigCancelled: PlainDescriptor<Anonymize<I5qolde99acmd1>>;
        /**
         * The deposit for a multisig operation has been updated/poked.
         */
        DepositPoked: PlainDescriptor<Anonymize<I8gtde5abn1g9a>>;
    };
    Utility: {
        /**
         * Batch of dispatches did not complete fully. Index of first failing dispatch given, as
         * well as the error.
         */
        BatchInterrupted: PlainDescriptor<Anonymize<I1s03nktomg1im>>;
        /**
         * Batch of dispatches completed fully with no error.
         */
        BatchCompleted: PlainDescriptor<undefined>;
        /**
         * Batch of dispatches completed but has errors.
         */
        BatchCompletedWithErrors: PlainDescriptor<undefined>;
        /**
         * A single item within a Batch of dispatches has completed with no error.
         */
        ItemCompleted: PlainDescriptor<undefined>;
        /**
         * A single item within a Batch of dispatches has completed with error.
         */
        ItemFailed: PlainDescriptor<Anonymize<I58kt5j7s04it1>>;
        /**
         * A call was dispatched.
         */
        DispatchedAs: PlainDescriptor<Anonymize<Ieahie1iccmfd4>>;
        /**
         * Main call was dispatched.
         */
        IfElseMainSuccess: PlainDescriptor<undefined>;
        /**
         * The fallback call was dispatched.
         */
        IfElseFallbackCalled: PlainDescriptor<Anonymize<Iavf0ibu3abt42>>;
    };
    Nfts: {
        /**
         * A `collection` was created.
         */
        Created: PlainDescriptor<Anonymize<I9gqanbbbe917p>>;
        /**
         * A `collection` was force-created.
         */
        ForceCreated: PlainDescriptor<Anonymize<Id1m1230297f7a>>;
        /**
         * A `collection` was destroyed.
         */
        Destroyed: PlainDescriptor<Anonymize<I6cu7obfo0rr0o>>;
        /**
         * An `item` was issued.
         */
        Issued: PlainDescriptor<Anonymize<Ifvb1p5munhhv4>>;
        /**
         * An `item` was transferred.
         */
        Transferred: PlainDescriptor<Anonymize<I46h83ilqeed3g>>;
        /**
         * An `item` was destroyed.
         */
        Burned: PlainDescriptor<Anonymize<Ifvb1p5munhhv4>>;
        /**
         * An `item` became non-transferable.
         */
        ItemTransferLocked: PlainDescriptor<Anonymize<Iafkqus0ohh6l6>>;
        /**
         * An `item` became transferable.
         */
        ItemTransferUnlocked: PlainDescriptor<Anonymize<Iafkqus0ohh6l6>>;
        /**
         * `item` metadata or attributes were locked.
         */
        ItemPropertiesLocked: PlainDescriptor<Anonymize<I1jj31tn29ie3c>>;
        /**
         * Some `collection` was locked.
         */
        CollectionLocked: PlainDescriptor<Anonymize<I6cu7obfo0rr0o>>;
        /**
         * The owner changed.
         */
        OwnerChanged: PlainDescriptor<Anonymize<Icahse3uoi76n7>>;
        /**
         * The management team changed.
         */
        TeamChanged: PlainDescriptor<Anonymize<Ico8bnjc6taa27>>;
        /**
         * An `item` of a `collection` has been approved by the `owner` for transfer by
         * a `delegate`.
         */
        TransferApproved: PlainDescriptor<Anonymize<I78i1bvlonei69>>;
        /**
         * An approval for a `delegate` account to transfer the `item` of an item
         * `collection` was cancelled by its `owner`.
         */
        ApprovalCancelled: PlainDescriptor<Anonymize<I5fjkvcb5vr6nb>>;
        /**
         * All approvals of an item got cancelled.
         */
        AllApprovalsCancelled: PlainDescriptor<Anonymize<Ifvb1p5munhhv4>>;
        /**
         * A `collection` has had its config changed by the `Force` origin.
         */
        CollectionConfigChanged: PlainDescriptor<Anonymize<I6cu7obfo0rr0o>>;
        /**
         * New metadata has been set for a `collection`.
         */
        CollectionMetadataSet: PlainDescriptor<Anonymize<I78u60nqh0etah>>;
        /**
         * Metadata has been cleared for a `collection`.
         */
        CollectionMetadataCleared: PlainDescriptor<Anonymize<I6cu7obfo0rr0o>>;
        /**
         * New metadata has been set for an item.
         */
        ItemMetadataSet: PlainDescriptor<Anonymize<Icrkms46uh8tpb>>;
        /**
         * Metadata has been cleared for an item.
         */
        ItemMetadataCleared: PlainDescriptor<Anonymize<Iafkqus0ohh6l6>>;
        /**
         * The deposit for a set of `item`s within a `collection` has been updated.
         */
        Redeposited: PlainDescriptor<Anonymize<I2gr1toekv86b9>>;
        /**
         * New attribute metadata has been set for a `collection` or `item`.
         */
        AttributeSet: PlainDescriptor<Anonymize<I5llu6o6a0go5i>>;
        /**
         * Attribute metadata has been cleared for a `collection` or `item`.
         */
        AttributeCleared: PlainDescriptor<Anonymize<I93r2effh7od84>>;
        /**
         * A new approval to modify item attributes was added.
         */
        ItemAttributesApprovalAdded: PlainDescriptor<Anonymize<I9i1f9mrso1hmf>>;
        /**
         * A new approval to modify item attributes was removed.
         */
        ItemAttributesApprovalRemoved: PlainDescriptor<Anonymize<I9i1f9mrso1hmf>>;
        /**
         * Ownership acceptance has changed for an account.
         */
        OwnershipAcceptanceChanged: PlainDescriptor<Anonymize<I2v2ikqt2trp52>>;
        /**
         * Max supply has been set for a collection.
         */
        CollectionMaxSupplySet: PlainDescriptor<Anonymize<I6h88h8vba22v8>>;
        /**
         * Mint settings for a collection had changed.
         */
        CollectionMintSettingsUpdated: PlainDescriptor<Anonymize<I6cu7obfo0rr0o>>;
        /**
         * Event gets emitted when the `NextCollectionId` gets incremented.
         */
        NextCollectionIdIncremented: PlainDescriptor<Anonymize<I9ksla2si91s56>>;
        /**
         * The price was set for the item.
         */
        ItemPriceSet: PlainDescriptor<Anonymize<If3057hi1g5qlo>>;
        /**
         * The price for the item was removed.
         */
        ItemPriceRemoved: PlainDescriptor<Anonymize<Iafkqus0ohh6l6>>;
        /**
         * An item was bought.
         */
        ItemBought: PlainDescriptor<Anonymize<Iaii5qf41d5n3d>>;
        /**
         * A tip was sent.
         */
        TipSent: PlainDescriptor<Anonymize<Id9j7b85otvjru>>;
        /**
         * An `item` swap intent was created.
         */
        SwapCreated: PlainDescriptor<Anonymize<Iaihk9pek2ajl9>>;
        /**
         * The swap was cancelled.
         */
        SwapCancelled: PlainDescriptor<Anonymize<Iaihk9pek2ajl9>>;
        /**
         * The swap has been claimed.
         */
        SwapClaimed: PlainDescriptor<Anonymize<Id9av23h47ufb2>>;
        /**
         * New attributes have been set for an `item` of the `collection`.
         */
        PreSignedAttributesSet: PlainDescriptor<Anonymize<Ib4kpnijas4jqp>>;
        /**
         * A new attribute in the `Pallet` namespace was set for the `collection` or an `item`
         * within that `collection`.
         */
        PalletAttributeSet: PlainDescriptor<Anonymize<I2vnu5k0u1i65h>>;
    };
    NftFractionalization: {
        /**
         * An NFT was successfully fractionalized.
         */
        NftFractionalized: PlainDescriptor<Anonymize<Ib67harsthtcvr>>;
        /**
         * An NFT was successfully returned back.
         */
        NftUnified: PlainDescriptor<Anonymize<Ic7ok3lq0728f7>>;
    };
    Assets: {
        /**
         * Some asset class was created.
         */
        Created: PlainDescriptor<Anonymize<I88ff3u4dpivk>>;
        /**
         * Some assets were issued.
         */
        Issued: PlainDescriptor<Anonymize<I33cp947glv1ks>>;
        /**
         * Some assets were transferred.
         */
        Transferred: PlainDescriptor<Anonymize<Ic9om1gmmqu7rq>>;
        /**
         * Some assets were destroyed.
         */
        Burned: PlainDescriptor<Anonymize<I5hfov2b68ppb6>>;
        /**
         * The management team changed.
         */
        TeamChanged: PlainDescriptor<Anonymize<Ibthhb2m9vneds>>;
        /**
         * The owner changed.
         */
        OwnerChanged: PlainDescriptor<Anonymize<Iaitn5bqfacj7k>>;
        /**
         * Some account `who` was frozen.
         */
        Frozen: PlainDescriptor<Anonymize<If4ebvclj2ugvi>>;
        /**
         * Some account `who` was thawed.
         */
        Thawed: PlainDescriptor<Anonymize<If4ebvclj2ugvi>>;
        /**
         * Some asset `asset_id` was frozen.
         */
        AssetFrozen: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
        /**
         * Some asset `asset_id` was thawed.
         */
        AssetThawed: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
        /**
         * Accounts were destroyed for given asset.
         */
        AccountsDestroyed: PlainDescriptor<Anonymize<Ieduc1e6frq8rb>>;
        /**
         * Approvals were destroyed for given asset.
         */
        ApprovalsDestroyed: PlainDescriptor<Anonymize<I9h6gbtabovtm4>>;
        /**
         * An asset class is in the process of being destroyed.
         */
        DestructionStarted: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
        /**
         * An asset class was destroyed.
         */
        Destroyed: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
        /**
         * Some asset class was force-created.
         */
        ForceCreated: PlainDescriptor<Anonymize<Iaitn5bqfacj7k>>;
        /**
         * New metadata has been set for an asset.
         */
        MetadataSet: PlainDescriptor<Anonymize<Ifnsa0dkkpf465>>;
        /**
         * Metadata has been cleared for an asset.
         */
        MetadataCleared: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
        /**
         * (Additional) funds have been approved for transfer to a destination account.
         */
        ApprovedTransfer: PlainDescriptor<Anonymize<I65dtqr2egjbc3>>;
        /**
         * An approval for account `delegate` was cancelled by `owner`.
         */
        ApprovalCancelled: PlainDescriptor<Anonymize<Ibqj3vg5s5lk0c>>;
        /**
         * An `amount` was transferred in its entirety from `owner` to `destination` by
         * the approved `delegate`.
         */
        TransferredApproved: PlainDescriptor<Anonymize<I6l73u513p8rna>>;
        /**
         * An asset has had its attributes changed by the `Force` origin.
         */
        AssetStatusChanged: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
        /**
         * The min_balance of an asset has been updated by the asset owner.
         */
        AssetMinBalanceChanged: PlainDescriptor<Anonymize<Iefqmt2htu1dlu>>;
        /**
         * Some account `who` was created with a deposit from `depositor`.
         */
        Touched: PlainDescriptor<Anonymize<If8bgtgqrchjtu>>;
        /**
         * Some account `who` was blocked.
         */
        Blocked: PlainDescriptor<Anonymize<If4ebvclj2ugvi>>;
        /**
         * Some assets were deposited (e.g. for transaction fees).
         */
        Deposited: PlainDescriptor<Anonymize<Idusmq77988cmt>>;
        /**
         * Some assets were withdrawn from the account (e.g. for transaction fees).
         */
        Withdrawn: PlainDescriptor<Anonymize<Idusmq77988cmt>>;
    };
    Revive: {
        /**
         * A custom event emitted by the contract.
         */
        ContractEmitted: PlainDescriptor<Anonymize<I7svbvm6hg57aj>>;
    };
    Fungibles: {
        /**
         * Event emitted when allowance by `owner` to `spender` changes.
         */
        Approval: PlainDescriptor<Anonymize<Ibrq3me0n6l1aa>>;
        /**
         * Event emitted when a token transfer occurs.
         */
        Transfer: PlainDescriptor<Anonymize<Ib1lp1vvi0snto>>;
        /**
         * Event emitted when a token is created.
         */
        Created: PlainDescriptor<Anonymize<Ib1tuirknugkf0>>;
    };
    Messaging: {
        /**
         * A GET has been dispatched via ISMP.
         */
        IsmpGetDispatched: PlainDescriptor<Anonymize<I9h4l0ivnpllq2>>;
        /**
         * A response to a GET has been received via ISMP.
         */
        IsmpGetResponseReceived: PlainDescriptor<Anonymize<I9e44up6jrgtq8>>;
        /**
         * A POST has been dispatched via ISMP.
         */
        IsmpPostDispatched: PlainDescriptor<Anonymize<I9h4l0ivnpllq2>>;
        /**
         * A response to a POST has been received via ISMP.
         */
        IsmpPostResponseReceived: PlainDescriptor<Anonymize<I9e44up6jrgtq8>>;
        /**
         * A XCM query has been created.
         */
        XcmQueryCreated: PlainDescriptor<Anonymize<I8lbid96jmoifn>>;
        /**
         * A response to a XCM query has been received.
         */
        XcmResponseReceived: PlainDescriptor<Anonymize<I6f9cs95vga45t>>;
        /**
         * A callback has been executed successfully.
         */
        CallbackExecuted: PlainDescriptor<Anonymize<I1q7llba29achm>>;
        /**
         * A callback has failed.
         */
        CallbackFailed: PlainDescriptor<Anonymize<I24fjcuv2i5g6p>>;
        /**
         * One or more messages have been removed for the origin.
         */
        Removed: PlainDescriptor<Anonymize<I787j4cmbcfj1a>>;
    };
};
type IError = {
    System: {
        /**
         * The name of specification does not match between the current runtime
         * and the new runtime.
         */
        InvalidSpecName: PlainDescriptor<undefined>;
        /**
         * The specification version is not allowed to decrease between the current runtime
         * and the new runtime.
         */
        SpecVersionNeedsToIncrease: PlainDescriptor<undefined>;
        /**
         * Failed to extract the runtime version from the new runtime.
         *
         * Either calling `Core_version` or decoding `RuntimeVersion` failed.
         */
        FailedToExtractRuntimeVersion: PlainDescriptor<undefined>;
        /**
         * Suicide called when the account has non-default composite data.
         */
        NonDefaultComposite: PlainDescriptor<undefined>;
        /**
         * There is a non-zero reference count preventing the account from being purged.
         */
        NonZeroRefCount: PlainDescriptor<undefined>;
        /**
         * The origin filter prevent the call to be dispatched.
         */
        CallFiltered: PlainDescriptor<undefined>;
        /**
         * A multi-block migration is ongoing and prevents the current code from being replaced.
         */
        MultiBlockMigrationsOngoing: PlainDescriptor<undefined>;
        /**
         * No upgrade authorized.
         */
        NothingAuthorized: PlainDescriptor<undefined>;
        /**
         * The submitted code is not authorized.
         */
        Unauthorized: PlainDescriptor<undefined>;
    };
    ParachainSystem: {
        /**
         * Attempt to upgrade validation function while existing upgrade pending.
         */
        OverlappingUpgrades: PlainDescriptor<undefined>;
        /**
         * Polkadot currently prohibits this parachain from upgrading its validation function.
         */
        ProhibitedByPolkadot: PlainDescriptor<undefined>;
        /**
         * The supplied validation function has compiled into a blob larger than Polkadot is
         * willing to run.
         */
        TooBig: PlainDescriptor<undefined>;
        /**
         * The inherent which supplies the validation data did not run this block.
         */
        ValidationDataNotAvailable: PlainDescriptor<undefined>;
        /**
         * The inherent which supplies the host configuration did not run this block.
         */
        HostConfigurationNotAvailable: PlainDescriptor<undefined>;
        /**
         * No validation function upgrade is currently scheduled.
         */
        NotScheduled: PlainDescriptor<undefined>;
    };
    MultiBlockMigrations: {
        /**
         * The operation cannot complete since some MBMs are ongoing.
         */
        Ongoing: PlainDescriptor<undefined>;
    };
    Balances: {
        /**
         * Vesting balance too high to send value.
         */
        VestingBalance: PlainDescriptor<undefined>;
        /**
         * Account liquidity restrictions prevent withdrawal.
         */
        LiquidityRestrictions: PlainDescriptor<undefined>;
        /**
         * Balance too low to send value.
         */
        InsufficientBalance: PlainDescriptor<undefined>;
        /**
         * Value too low to create account due to existential deposit.
         */
        ExistentialDeposit: PlainDescriptor<undefined>;
        /**
         * Transfer/payment would kill account.
         */
        Expendability: PlainDescriptor<undefined>;
        /**
         * A vesting schedule already exists for this account.
         */
        ExistingVestingSchedule: PlainDescriptor<undefined>;
        /**
         * Beneficiary account must pre-exist.
         */
        DeadAccount: PlainDescriptor<undefined>;
        /**
         * Number of named reserves exceed `MaxReserves`.
         */
        TooManyReserves: PlainDescriptor<undefined>;
        /**
         * Number of holds exceed `VariantCountOf<T::RuntimeHoldReason>`.
         */
        TooManyHolds: PlainDescriptor<undefined>;
        /**
         * Number of freezes exceed `MaxFreezes`.
         */
        TooManyFreezes: PlainDescriptor<undefined>;
        /**
         * The issuance cannot be modified since it is already deactivated.
         */
        IssuanceDeactivated: PlainDescriptor<undefined>;
        /**
         * The delta cannot be zero.
         */
        DeltaZero: PlainDescriptor<undefined>;
    };
    Treasury: {
        /**
         * No proposal, bounty or spend at that index.
         */
        InvalidIndex: PlainDescriptor<undefined>;
        /**
         * Too many approvals in the queue.
         */
        TooManyApprovals: PlainDescriptor<undefined>;
        /**
         * The spend origin is valid but the amount it is allowed to spend is lower than the
         * amount to be spent.
         */
        InsufficientPermission: PlainDescriptor<undefined>;
        /**
         * Proposal has not been approved.
         */
        ProposalNotApproved: PlainDescriptor<undefined>;
        /**
         * The balance of the asset kind is not convertible to the balance of the native asset.
         */
        FailedToConvertBalance: PlainDescriptor<undefined>;
        /**
         * The spend has expired and cannot be claimed.
         */
        SpendExpired: PlainDescriptor<undefined>;
        /**
         * The spend is not yet eligible for payout.
         */
        EarlyPayout: PlainDescriptor<undefined>;
        /**
         * The payment has already been attempted.
         */
        AlreadyAttempted: PlainDescriptor<undefined>;
        /**
         * There was some issue with the mechanism of payment.
         */
        PayoutError: PlainDescriptor<undefined>;
        /**
         * The payout was not yet attempted/claimed.
         */
        NotAttempted: PlainDescriptor<undefined>;
        /**
         * The payment has neither failed nor succeeded yet.
         */
        Inconclusive: PlainDescriptor<undefined>;
    };
    Sudo: {
        /**
         * Sender must be the Sudo account.
         */
        RequireSudo: PlainDescriptor<undefined>;
    };
    Council: {
        /**
         * Account is not a member
         */
        NotMember: PlainDescriptor<undefined>;
        /**
         * Duplicate proposals not allowed
         */
        DuplicateProposal: PlainDescriptor<undefined>;
        /**
         * Proposal must exist
         */
        ProposalMissing: PlainDescriptor<undefined>;
        /**
         * Mismatched index
         */
        WrongIndex: PlainDescriptor<undefined>;
        /**
         * Duplicate vote ignored
         */
        DuplicateVote: PlainDescriptor<undefined>;
        /**
         * Members are already initialized!
         */
        AlreadyInitialized: PlainDescriptor<undefined>;
        /**
         * The close call was made too early, before the end of the voting.
         */
        TooEarly: PlainDescriptor<undefined>;
        /**
         * There can only be a maximum of `MaxProposals` active proposals.
         */
        TooManyProposals: PlainDescriptor<undefined>;
        /**
         * The given weight bound for the proposal was too low.
         */
        WrongProposalWeight: PlainDescriptor<undefined>;
        /**
         * The given length bound for the proposal was too low.
         */
        WrongProposalLength: PlainDescriptor<undefined>;
        /**
         * Prime account is not a member
         */
        PrimeAccountNotMember: PlainDescriptor<undefined>;
        /**
         * Proposal is still active.
         */
        ProposalActive: PlainDescriptor<undefined>;
    };
    CollatorSelection: {
        /**
         * The pallet has too many candidates.
         */
        TooManyCandidates: PlainDescriptor<undefined>;
        /**
         * Leaving would result in too few candidates.
         */
        TooFewEligibleCollators: PlainDescriptor<undefined>;
        /**
         * Account is already a candidate.
         */
        AlreadyCandidate: PlainDescriptor<undefined>;
        /**
         * Account is not a candidate.
         */
        NotCandidate: PlainDescriptor<undefined>;
        /**
         * There are too many Invulnerables.
         */
        TooManyInvulnerables: PlainDescriptor<undefined>;
        /**
         * Account is already an Invulnerable.
         */
        AlreadyInvulnerable: PlainDescriptor<undefined>;
        /**
         * Account is not an Invulnerable.
         */
        NotInvulnerable: PlainDescriptor<undefined>;
        /**
         * Account has no associated validator ID.
         */
        NoAssociatedValidatorId: PlainDescriptor<undefined>;
        /**
         * Validator ID is not yet registered.
         */
        ValidatorNotRegistered: PlainDescriptor<undefined>;
        /**
         * Could not insert in the candidate list.
         */
        InsertToCandidateListFailed: PlainDescriptor<undefined>;
        /**
         * Could not remove from the candidate list.
         */
        RemoveFromCandidateListFailed: PlainDescriptor<undefined>;
        /**
         * New deposit amount would be below the minimum candidacy bond.
         */
        DepositTooLow: PlainDescriptor<undefined>;
        /**
         * Could not update the candidate list.
         */
        UpdateCandidateListFailed: PlainDescriptor<undefined>;
        /**
         * Deposit amount is too low to take the target's slot in the candidate list.
         */
        InsufficientBond: PlainDescriptor<undefined>;
        /**
         * The target account to be replaced in the candidate list is not a candidate.
         */
        TargetIsNotCandidate: PlainDescriptor<undefined>;
        /**
         * The updated deposit amount is equal to the amount already reserved.
         */
        IdenticalDeposit: PlainDescriptor<undefined>;
        /**
         * Cannot lower candidacy bond while occupying a future collator slot in the list.
         */
        InvalidUnreserve: PlainDescriptor<undefined>;
    };
    Session: {
        /**
         * Invalid ownership proof.
         */
        InvalidProof: PlainDescriptor<undefined>;
        /**
         * No associated validator ID for account.
         */
        NoAssociatedValidatorId: PlainDescriptor<undefined>;
        /**
         * Registered duplicate key.
         */
        DuplicatedKey: PlainDescriptor<undefined>;
        /**
         * No keys are associated with this account.
         */
        NoKeys: PlainDescriptor<undefined>;
        /**
         * Key setting account is not live, so it's impossible to associate keys.
         */
        NoAccount: PlainDescriptor<undefined>;
    };
    Scheduler: {
        /**
         * Failed to schedule a call
         */
        FailedToSchedule: PlainDescriptor<undefined>;
        /**
         * Cannot find the scheduled call.
         */
        NotFound: PlainDescriptor<undefined>;
        /**
         * Given target block number is in the past.
         */
        TargetBlockNumberInPast: PlainDescriptor<undefined>;
        /**
         * Reschedule failed because it does not change scheduled time.
         */
        RescheduleNoChange: PlainDescriptor<undefined>;
        /**
         * Attempt to use a non-named function on a named task.
         */
        Named: PlainDescriptor<undefined>;
    };
    Preimage: {
        /**
         * Preimage is too large to store on-chain.
         */
        TooBig: PlainDescriptor<undefined>;
        /**
         * Preimage has already been noted on-chain.
         */
        AlreadyNoted: PlainDescriptor<undefined>;
        /**
         * The user is not authorized to perform this action.
         */
        NotAuthorized: PlainDescriptor<undefined>;
        /**
         * The preimage cannot be removed since it has not yet been noted.
         */
        NotNoted: PlainDescriptor<undefined>;
        /**
         * A preimage may not be removed when there are outstanding requests.
         */
        Requested: PlainDescriptor<undefined>;
        /**
         * The preimage request cannot be removed since no outstanding requests exist.
         */
        NotRequested: PlainDescriptor<undefined>;
        /**
         * More than `MAX_HASH_UPGRADE_BULK_COUNT` hashes were requested to be upgraded at once.
         */
        TooMany: PlainDescriptor<undefined>;
        /**
         * Too few hashes were requested to be upgraded (i.e. zero).
         */
        TooFew: PlainDescriptor<undefined>;
    };
    XcmpQueue: {
        /**
         * Setting the queue config failed since one of its values was invalid.
         */
        BadQueueConfig: PlainDescriptor<undefined>;
        /**
         * The execution is already suspended.
         */
        AlreadySuspended: PlainDescriptor<undefined>;
        /**
         * The execution is already resumed.
         */
        AlreadyResumed: PlainDescriptor<undefined>;
        /**
         * There are too many active outbound channels.
         */
        TooManyActiveOutboundChannels: PlainDescriptor<undefined>;
        /**
         * The message is too big.
         */
        TooBig: PlainDescriptor<undefined>;
    };
    PolkadotXcm: {
        /**
         * The desired destination was unreachable, generally because there is a no way of routing
         * to it.
         */
        Unreachable: PlainDescriptor<undefined>;
        /**
         * There was some other issue (i.e. not to do with routing) in sending the message.
         * Perhaps a lack of space for buffering the message.
         */
        SendFailure: PlainDescriptor<undefined>;
        /**
         * The message execution fails the filter.
         */
        Filtered: PlainDescriptor<undefined>;
        /**
         * The message's weight could not be determined.
         */
        UnweighableMessage: PlainDescriptor<undefined>;
        /**
         * The destination `Location` provided cannot be inverted.
         */
        DestinationNotInvertible: PlainDescriptor<undefined>;
        /**
         * The assets to be sent are empty.
         */
        Empty: PlainDescriptor<undefined>;
        /**
         * Could not re-anchor the assets to declare the fees for the destination chain.
         */
        CannotReanchor: PlainDescriptor<undefined>;
        /**
         * Too many assets have been attempted for transfer.
         */
        TooManyAssets: PlainDescriptor<undefined>;
        /**
         * Origin is invalid for sending.
         */
        InvalidOrigin: PlainDescriptor<undefined>;
        /**
         * The version of the `Versioned` value used is not able to be interpreted.
         */
        BadVersion: PlainDescriptor<undefined>;
        /**
         * The given location could not be used (e.g. because it cannot be expressed in the
         * desired version of XCM).
         */
        BadLocation: PlainDescriptor<undefined>;
        /**
         * The referenced subscription could not be found.
         */
        NoSubscription: PlainDescriptor<undefined>;
        /**
         * The location is invalid since it already has a subscription from us.
         */
        AlreadySubscribed: PlainDescriptor<undefined>;
        /**
         * Could not check-out the assets for teleportation to the destination chain.
         */
        CannotCheckOutTeleport: PlainDescriptor<undefined>;
        /**
         * The owner does not own (all) of the asset that they wish to do the operation on.
         */
        LowBalance: PlainDescriptor<undefined>;
        /**
         * The asset owner has too many locks on the asset.
         */
        TooManyLocks: PlainDescriptor<undefined>;
        /**
         * The given account is not an identifiable sovereign account for any location.
         */
        AccountNotSovereign: PlainDescriptor<undefined>;
        /**
         * The operation required fees to be paid which the initiator could not meet.
         */
        FeesNotMet: PlainDescriptor<undefined>;
        /**
         * A remote lock with the corresponding data could not be found.
         */
        LockNotFound: PlainDescriptor<undefined>;
        /**
         * The unlock operation cannot succeed because there are still consumers of the lock.
         */
        InUse: PlainDescriptor<undefined>;
        /**
         * Invalid asset, reserve chain could not be determined for it.
         */
        InvalidAssetUnknownReserve: PlainDescriptor<undefined>;
        /**
         * Invalid asset, do not support remote asset reserves with different fees reserves.
         */
        InvalidAssetUnsupportedReserve: PlainDescriptor<undefined>;
        /**
         * Too many assets with different reserve locations have been attempted for transfer.
         */
        TooManyReserves: PlainDescriptor<undefined>;
        /**
         * Local XCM execution incomplete.
         */
        LocalExecutionIncomplete: PlainDescriptor<undefined>;
        /**
         * Too many locations authorized to alias origin.
         */
        TooManyAuthorizedAliases: PlainDescriptor<undefined>;
        /**
         * Expiry block number is in the past.
         */
        ExpiresInPast: PlainDescriptor<undefined>;
        /**
         * The alias to remove authorization for was not found.
         */
        AliasNotFound: PlainDescriptor<undefined>;
    };
    MessageQueue: {
        /**
         * Page is not reapable because it has items remaining to be processed and is not old
         * enough.
         */
        NotReapable: PlainDescriptor<undefined>;
        /**
         * Page to be reaped does not exist.
         */
        NoPage: PlainDescriptor<undefined>;
        /**
         * The referenced message could not be found.
         */
        NoMessage: PlainDescriptor<undefined>;
        /**
         * The message was already processed and cannot be processed again.
         */
        AlreadyProcessed: PlainDescriptor<undefined>;
        /**
         * The message is queued for future execution.
         */
        Queued: PlainDescriptor<undefined>;
        /**
         * There is temporarily not enough weight to continue servicing messages.
         */
        InsufficientWeight: PlainDescriptor<undefined>;
        /**
         * This message is temporarily unprocessable.
         *
         * Such errors are expected, but not guaranteed, to resolve themselves eventually through
         * retrying.
         */
        TemporarilyUnprocessable: PlainDescriptor<undefined>;
        /**
         * The queue is paused and no message can be executed from it.
         *
         * This can change at any time and may resolve in the future by re-trying.
         */
        QueuePaused: PlainDescriptor<undefined>;
        /**
         * Another call is in progress and needs to finish before this call can happen.
         */
        RecursiveDisallowed: PlainDescriptor<undefined>;
    };
    Ismp: {
        /**
         * Invalid ISMP message
         */
        InvalidMessage: PlainDescriptor<undefined>;
        /**
         * Requested message was not found
         */
        MessageNotFound: PlainDescriptor<undefined>;
        /**
         * Encountered an error while creating the consensus client.
         */
        ConsensusClientCreationFailed: PlainDescriptor<undefined>;
        /**
         * Couldn't update unbonding period
         */
        UnbondingPeriodUpdateFailed: PlainDescriptor<undefined>;
        /**
         * Couldn't update challenge period
         */
        ChallengePeriodUpdateFailed: PlainDescriptor<undefined>;
    };
    Contracts: {
        /**
         * Invalid schedule supplied, e.g. with zero weight of a basic operation.
         */
        InvalidSchedule: PlainDescriptor<undefined>;
        /**
         * Invalid combination of flags supplied to `seal_call` or `seal_delegate_call`.
         */
        InvalidCallFlags: PlainDescriptor<undefined>;
        /**
         * The executed contract exhausted its gas limit.
         */
        OutOfGas: PlainDescriptor<undefined>;
        /**
         * The output buffer supplied to a contract API call was too small.
         */
        OutputBufferTooSmall: PlainDescriptor<undefined>;
        /**
         * Performing the requested transfer failed. Probably because there isn't enough
         * free balance in the sender's account.
         */
        TransferFailed: PlainDescriptor<undefined>;
        /**
         * Performing a call was denied because the calling depth reached the limit
         * of what is specified in the schedule.
         */
        MaxCallDepthReached: PlainDescriptor<undefined>;
        /**
         * No contract was found at the specified address.
         */
        ContractNotFound: PlainDescriptor<undefined>;
        /**
         * The code supplied to `instantiate_with_code` exceeds the limit specified in the
         * current schedule.
         */
        CodeTooLarge: PlainDescriptor<undefined>;
        /**
         * No code could be found at the supplied code hash.
         */
        CodeNotFound: PlainDescriptor<undefined>;
        /**
         * No code info could be found at the supplied code hash.
         */
        CodeInfoNotFound: PlainDescriptor<undefined>;
        /**
         * A buffer outside of sandbox memory was passed to a contract API function.
         */
        OutOfBounds: PlainDescriptor<undefined>;
        /**
         * Input passed to a contract API function failed to decode as expected type.
         */
        DecodingFailed: PlainDescriptor<undefined>;
        /**
         * Contract trapped during execution.
         */
        ContractTrapped: PlainDescriptor<undefined>;
        /**
         * The size defined in `T::MaxValueSize` was exceeded.
         */
        ValueTooLarge: PlainDescriptor<undefined>;
        /**
         * Termination of a contract is not allowed while the contract is already
         * on the call stack. Can be triggered by `seal_terminate`.
         */
        TerminatedWhileReentrant: PlainDescriptor<undefined>;
        /**
         * `seal_call` forwarded this contracts input. It therefore is no longer available.
         */
        InputForwarded: PlainDescriptor<undefined>;
        /**
         * The subject passed to `seal_random` exceeds the limit.
         */
        RandomSubjectTooLong: PlainDescriptor<undefined>;
        /**
         * The amount of topics passed to `seal_deposit_events` exceeds the limit.
         */
        TooManyTopics: PlainDescriptor<undefined>;
        /**
         * The chain does not provide a chain extension. Calling the chain extension results
         * in this error. Note that this usually  shouldn't happen as deploying such contracts
         * is rejected.
         */
        NoChainExtension: PlainDescriptor<undefined>;
        /**
         * Failed to decode the XCM program.
         */
        XCMDecodeFailed: PlainDescriptor<undefined>;
        /**
         * A contract with the same AccountId already exists.
         */
        DuplicateContract: PlainDescriptor<undefined>;
        /**
         * A contract self destructed in its constructor.
         *
         * This can be triggered by a call to `seal_terminate`.
         */
        TerminatedInConstructor: PlainDescriptor<undefined>;
        /**
         * A call tried to invoke a contract that is flagged as non-reentrant.
         * The only other cause is that a call from a contract into the runtime tried to call back
         * into `pallet-contracts`. This would make the whole pallet reentrant with regard to
         * contract code execution which is not supported.
         */
        ReentranceDenied: PlainDescriptor<undefined>;
        /**
         * A contract attempted to invoke a state modifying API while being in read-only mode.
         */
        StateChangeDenied: PlainDescriptor<undefined>;
        /**
         * Origin doesn't have enough balance to pay the required storage deposits.
         */
        StorageDepositNotEnoughFunds: PlainDescriptor<undefined>;
        /**
         * More storage was created than allowed by the storage deposit limit.
         */
        StorageDepositLimitExhausted: PlainDescriptor<undefined>;
        /**
         * Code removal was denied because the code is still in use by at least one contract.
         */
        CodeInUse: PlainDescriptor<undefined>;
        /**
         * The contract ran to completion but decided to revert its storage changes.
         * Please note that this error is only returned from extrinsics. When called directly
         * or via RPC an `Ok` will be returned. In this case the caller needs to inspect the flags
         * to determine whether a reversion has taken place.
         */
        ContractReverted: PlainDescriptor<undefined>;
        /**
         * The contract's code was found to be invalid during validation.
         *
         * The most likely cause of this is that an API was used which is not supported by the
         * node. This happens if an older node is used with a new version of ink!. Try updating
         * your node to the newest available version.
         *
         * A more detailed error can be found on the node console if debug messages are enabled
         * by supplying `-lruntime::contracts=debug`.
         */
        CodeRejected: PlainDescriptor<undefined>;
        /**
         * An indeterministic code was used in a context where this is not permitted.
         */
        Indeterministic: PlainDescriptor<undefined>;
        /**
         * A pending migration needs to complete before the extrinsic can be called.
         */
        MigrationInProgress: PlainDescriptor<undefined>;
        /**
         * Migrate dispatch call was attempted but no migration was performed.
         */
        NoMigrationPerformed: PlainDescriptor<undefined>;
        /**
         * The contract has reached its maximum number of delegate dependencies.
         */
        MaxDelegateDependenciesReached: PlainDescriptor<undefined>;
        /**
         * The dependency was not found in the contract's delegate dependencies.
         */
        DelegateDependencyNotFound: PlainDescriptor<undefined>;
        /**
         * The contract already depends on the given delegate dependency.
         */
        DelegateDependencyAlreadyExists: PlainDescriptor<undefined>;
        /**
         * Can not add a delegate dependency to the code hash of the contract itself.
         */
        CannotAddSelfAsDelegateDependency: PlainDescriptor<undefined>;
        /**
         * Can not add more data to transient storage.
         */
        OutOfTransientStorage: PlainDescriptor<undefined>;
    };
    Proxy: {
        /**
         * There are too many proxies registered or too many announcements pending.
         */
        TooMany: PlainDescriptor<undefined>;
        /**
         * Proxy registration not found.
         */
        NotFound: PlainDescriptor<undefined>;
        /**
         * Sender is not a proxy of the account to be proxied.
         */
        NotProxy: PlainDescriptor<undefined>;
        /**
         * A call which is incompatible with the proxy type's filter was attempted.
         */
        Unproxyable: PlainDescriptor<undefined>;
        /**
         * Account is already a proxy.
         */
        Duplicate: PlainDescriptor<undefined>;
        /**
         * Call may not be made by proxy because it may escalate its privileges.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         * Announcement, if made at all, was made too recently.
         */
        Unannounced: PlainDescriptor<undefined>;
        /**
         * Cannot add self as proxy.
         */
        NoSelfProxy: PlainDescriptor<undefined>;
    };
    Multisig: {
        /**
         * Threshold must be 2 or greater.
         */
        MinimumThreshold: PlainDescriptor<undefined>;
        /**
         * Call is already approved by this signatory.
         */
        AlreadyApproved: PlainDescriptor<undefined>;
        /**
         * Call doesn't need any (more) approvals.
         */
        NoApprovalsNeeded: PlainDescriptor<undefined>;
        /**
         * There are too few signatories in the list.
         */
        TooFewSignatories: PlainDescriptor<undefined>;
        /**
         * There are too many signatories in the list.
         */
        TooManySignatories: PlainDescriptor<undefined>;
        /**
         * The signatories were provided out of order; they should be ordered.
         */
        SignatoriesOutOfOrder: PlainDescriptor<undefined>;
        /**
         * The sender was contained in the other signatories; it shouldn't be.
         */
        SenderInSignatories: PlainDescriptor<undefined>;
        /**
         * Multisig operation not found in storage.
         */
        NotFound: PlainDescriptor<undefined>;
        /**
         * Only the account that originally created the multisig is able to cancel it or update
         * its deposits.
         */
        NotOwner: PlainDescriptor<undefined>;
        /**
         * No timepoint was given, yet the multisig operation is already underway.
         */
        NoTimepoint: PlainDescriptor<undefined>;
        /**
         * A different timepoint was given to the multisig operation that is underway.
         */
        WrongTimepoint: PlainDescriptor<undefined>;
        /**
         * A timepoint was given, yet no multisig operation is underway.
         */
        UnexpectedTimepoint: PlainDescriptor<undefined>;
        /**
         * The maximum weight information provided was too low.
         */
        MaxWeightTooLow: PlainDescriptor<undefined>;
        /**
         * The data to be stored is already stored.
         */
        AlreadyStored: PlainDescriptor<undefined>;
    };
    Utility: {
        /**
         * Too many calls batched.
         */
        TooManyCalls: PlainDescriptor<undefined>;
    };
    Nfts: {
        /**
         * The signing account has no permission to do the operation.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         * The given item ID is unknown.
         */
        UnknownCollection: PlainDescriptor<undefined>;
        /**
         * The item ID has already been used for an item.
         */
        AlreadyExists: PlainDescriptor<undefined>;
        /**
         * The approval had a deadline that expired, so the approval isn't valid anymore.
         */
        ApprovalExpired: PlainDescriptor<undefined>;
        /**
         * The owner turned out to be different to what was expected.
         */
        WrongOwner: PlainDescriptor<undefined>;
        /**
         * The witness data given does not match the current state of the chain.
         */
        BadWitness: PlainDescriptor<undefined>;
        /**
         * Collection ID is already taken.
         */
        CollectionIdInUse: PlainDescriptor<undefined>;
        /**
         * Items within that collection are non-transferable.
         */
        ItemsNonTransferable: PlainDescriptor<undefined>;
        /**
         * The provided account is not a delegate.
         */
        NotDelegate: PlainDescriptor<undefined>;
        /**
         * The delegate turned out to be different to what was expected.
         */
        WrongDelegate: PlainDescriptor<undefined>;
        /**
         * No approval exists that would allow the transfer.
         */
        Unapproved: PlainDescriptor<undefined>;
        /**
         * The named owner has not signed ownership acceptance of the collection.
         */
        Unaccepted: PlainDescriptor<undefined>;
        /**
         * The item is locked (non-transferable).
         */
        ItemLocked: PlainDescriptor<undefined>;
        /**
         * Item's attributes are locked.
         */
        LockedItemAttributes: PlainDescriptor<undefined>;
        /**
         * Collection's attributes are locked.
         */
        LockedCollectionAttributes: PlainDescriptor<undefined>;
        /**
         * Item's metadata is locked.
         */
        LockedItemMetadata: PlainDescriptor<undefined>;
        /**
         * Collection's metadata is locked.
         */
        LockedCollectionMetadata: PlainDescriptor<undefined>;
        /**
         * All items have been minted.
         */
        MaxSupplyReached: PlainDescriptor<undefined>;
        /**
         * The max supply is locked and can't be changed.
         */
        MaxSupplyLocked: PlainDescriptor<undefined>;
        /**
         * The provided max supply is less than the number of items a collection already has.
         */
        MaxSupplyTooSmall: PlainDescriptor<undefined>;
        /**
         * The given item ID is unknown.
         */
        UnknownItem: PlainDescriptor<undefined>;
        /**
         * Swap doesn't exist.
         */
        UnknownSwap: PlainDescriptor<undefined>;
        /**
         * The given item has no metadata set.
         */
        MetadataNotFound: PlainDescriptor<undefined>;
        /**
         * The provided attribute can't be found.
         */
        AttributeNotFound: PlainDescriptor<undefined>;
        /**
         * Item is not for sale.
         */
        NotForSale: PlainDescriptor<undefined>;
        /**
         * The provided bid is too low.
         */
        BidTooLow: PlainDescriptor<undefined>;
        /**
         * The item has reached its approval limit.
         */
        ReachedApprovalLimit: PlainDescriptor<undefined>;
        /**
         * The deadline has already expired.
         */
        DeadlineExpired: PlainDescriptor<undefined>;
        /**
         * The duration provided should be less than or equal to `MaxDeadlineDuration`.
         */
        WrongDuration: PlainDescriptor<undefined>;
        /**
         * The method is disabled by system settings.
         */
        MethodDisabled: PlainDescriptor<undefined>;
        /**
         * The provided setting can't be set.
         */
        WrongSetting: PlainDescriptor<undefined>;
        /**
         * Item's config already exists and should be equal to the provided one.
         */
        InconsistentItemConfig: PlainDescriptor<undefined>;
        /**
         * Config for a collection or an item can't be found.
         */
        NoConfig: PlainDescriptor<undefined>;
        /**
         * Some roles were not cleared.
         */
        RolesNotCleared: PlainDescriptor<undefined>;
        /**
         * Mint has not started yet.
         */
        MintNotStarted: PlainDescriptor<undefined>;
        /**
         * Mint has already ended.
         */
        MintEnded: PlainDescriptor<undefined>;
        /**
         * The provided Item was already used for claiming.
         */
        AlreadyClaimed: PlainDescriptor<undefined>;
        /**
         * The provided data is incorrect.
         */
        IncorrectData: PlainDescriptor<undefined>;
        /**
         * The extrinsic was sent by the wrong origin.
         */
        WrongOrigin: PlainDescriptor<undefined>;
        /**
         * The provided signature is incorrect.
         */
        WrongSignature: PlainDescriptor<undefined>;
        /**
         * The provided metadata might be too long.
         */
        IncorrectMetadata: PlainDescriptor<undefined>;
        /**
         * Can't set more attributes per one call.
         */
        MaxAttributesLimitReached: PlainDescriptor<undefined>;
        /**
         * The provided namespace isn't supported in this call.
         */
        WrongNamespace: PlainDescriptor<undefined>;
        /**
         * Can't delete non-empty collections.
         */
        CollectionNotEmpty: PlainDescriptor<undefined>;
        /**
         * The witness data should be provided.
         */
        WitnessRequired: PlainDescriptor<undefined>;
    };
    NftFractionalization: {
        /**
         * Asset ID does not correspond to locked NFT.
         */
        IncorrectAssetId: PlainDescriptor<undefined>;
        /**
         * The signing account has no permission to do the operation.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         * NFT doesn't exist.
         */
        NftNotFound: PlainDescriptor<undefined>;
        /**
         * NFT has not yet been fractionalised.
         */
        NftNotFractionalized: PlainDescriptor<undefined>;
    };
    Assets: {
        /**
         * Account balance must be greater than or equal to the transfer amount.
         */
        BalanceLow: PlainDescriptor<undefined>;
        /**
         * The account to alter does not exist.
         */
        NoAccount: PlainDescriptor<undefined>;
        /**
         * The signing account has no permission to do the operation.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         * The given asset ID is unknown.
         */
        Unknown: PlainDescriptor<undefined>;
        /**
         * The origin account is frozen.
         */
        Frozen: PlainDescriptor<undefined>;
        /**
         * The asset ID is already taken.
         */
        InUse: PlainDescriptor<undefined>;
        /**
         * Invalid witness data given.
         */
        BadWitness: PlainDescriptor<undefined>;
        /**
         * Minimum balance should be non-zero.
         */
        MinBalanceZero: PlainDescriptor<undefined>;
        /**
         * Unable to increment the consumer reference counters on the account. Either no provider
         * reference exists to allow a non-zero balance of a non-self-sufficient asset, or one
         * fewer then the maximum number of consumers has been reached.
         */
        UnavailableConsumer: PlainDescriptor<undefined>;
        /**
         * Invalid metadata given.
         */
        BadMetadata: PlainDescriptor<undefined>;
        /**
         * No approval exists that would allow the transfer.
         */
        Unapproved: PlainDescriptor<undefined>;
        /**
         * The source account would not survive the transfer and it needs to stay alive.
         */
        WouldDie: PlainDescriptor<undefined>;
        /**
         * The asset-account already exists.
         */
        AlreadyExists: PlainDescriptor<undefined>;
        /**
         * The asset-account doesn't have an associated deposit.
         */
        NoDeposit: PlainDescriptor<undefined>;
        /**
         * The operation would result in funds being burned.
         */
        WouldBurn: PlainDescriptor<undefined>;
        /**
         * The asset is a live asset and is actively being used. Usually emit for operations such
         * as `start_destroy` which require the asset to be in a destroying state.
         */
        LiveAsset: PlainDescriptor<undefined>;
        /**
         * The asset is not live, and likely being destroyed.
         */
        AssetNotLive: PlainDescriptor<undefined>;
        /**
         * The asset status is not the expected status.
         */
        IncorrectStatus: PlainDescriptor<undefined>;
        /**
         * The asset should be frozen before the given operation.
         */
        NotFrozen: PlainDescriptor<undefined>;
        /**
         * Callback action resulted in error
         */
        CallbackFailed: PlainDescriptor<undefined>;
        /**
         * The asset ID must be equal to the [`NextAssetId`].
         */
        BadAssetId: PlainDescriptor<undefined>;
        /**
         * The asset cannot be destroyed because some accounts for this asset contain freezes.
         */
        ContainsFreezes: PlainDescriptor<undefined>;
        /**
         * The asset cannot be destroyed because some accounts for this asset contain holds.
         */
        ContainsHolds: PlainDescriptor<undefined>;
    };
    Revive: {
        /**
         * Invalid schedule supplied, e.g. with zero weight of a basic operation.
         */
        InvalidSchedule: PlainDescriptor<undefined>;
        /**
         * Invalid combination of flags supplied to `seal_call` or `seal_delegate_call`.
         */
        InvalidCallFlags: PlainDescriptor<undefined>;
        /**
         * The executed contract exhausted its gas limit.
         */
        OutOfGas: PlainDescriptor<undefined>;
        /**
         * Performing the requested transfer failed. Probably because there isn't enough
         * free balance in the sender's account.
         */
        TransferFailed: PlainDescriptor<undefined>;
        /**
         * Performing a call was denied because the calling depth reached the limit
         * of what is specified in the schedule.
         */
        MaxCallDepthReached: PlainDescriptor<undefined>;
        /**
         * No contract was found at the specified address.
         */
        ContractNotFound: PlainDescriptor<undefined>;
        /**
         * No code could be found at the supplied code hash.
         */
        CodeNotFound: PlainDescriptor<undefined>;
        /**
         * No code info could be found at the supplied code hash.
         */
        CodeInfoNotFound: PlainDescriptor<undefined>;
        /**
         * A buffer outside of sandbox memory was passed to a contract API function.
         */
        OutOfBounds: PlainDescriptor<undefined>;
        /**
         * Input passed to a contract API function failed to decode as expected type.
         */
        DecodingFailed: PlainDescriptor<undefined>;
        /**
         * Contract trapped during execution.
         */
        ContractTrapped: PlainDescriptor<undefined>;
        /**
         * The size defined in `T::MaxValueSize` was exceeded.
         */
        ValueTooLarge: PlainDescriptor<undefined>;
        /**
         * Termination of a contract is not allowed while the contract is already
         * on the call stack. Can be triggered by `seal_terminate`.
         */
        TerminatedWhileReentrant: PlainDescriptor<undefined>;
        /**
         * `seal_call` forwarded this contracts input. It therefore is no longer available.
         */
        InputForwarded: PlainDescriptor<undefined>;
        /**
         * The amount of topics passed to `seal_deposit_events` exceeds the limit.
         */
        TooManyTopics: PlainDescriptor<undefined>;
        /**
         * The chain does not provide a chain extension. Calling the chain extension results
         * in this error. Note that this usually  shouldn't happen as deploying such contracts
         * is rejected.
         */
        NoChainExtension: PlainDescriptor<undefined>;
        /**
         * Failed to decode the XCM program.
         */
        XCMDecodeFailed: PlainDescriptor<undefined>;
        /**
         * A contract with the same AccountId already exists.
         */
        DuplicateContract: PlainDescriptor<undefined>;
        /**
         * A contract self destructed in its constructor.
         *
         * This can be triggered by a call to `seal_terminate`.
         */
        TerminatedInConstructor: PlainDescriptor<undefined>;
        /**
         * A call tried to invoke a contract that is flagged as non-reentrant.
         */
        ReentranceDenied: PlainDescriptor<undefined>;
        /**
         * A contract called into the runtime which then called back into this pallet.
         */
        ReenteredPallet: PlainDescriptor<undefined>;
        /**
         * A contract attempted to invoke a state modifying API while being in read-only mode.
         */
        StateChangeDenied: PlainDescriptor<undefined>;
        /**
         * Origin doesn't have enough balance to pay the required storage deposits.
         */
        StorageDepositNotEnoughFunds: PlainDescriptor<undefined>;
        /**
         * More storage was created than allowed by the storage deposit limit.
         */
        StorageDepositLimitExhausted: PlainDescriptor<undefined>;
        /**
         * Code removal was denied because the code is still in use by at least one contract.
         */
        CodeInUse: PlainDescriptor<undefined>;
        /**
         * The contract ran to completion but decided to revert its storage changes.
         * Please note that this error is only returned from extrinsics. When called directly
         * or via RPC an `Ok` will be returned. In this case the caller needs to inspect the flags
         * to determine whether a reversion has taken place.
         */
        ContractReverted: PlainDescriptor<undefined>;
        /**
         * The contract failed to compile or is missing the correct entry points.
         *
         * A more detailed error can be found on the node console if debug messages are enabled
         * by supplying `-lruntime::revive=debug`.
         */
        CodeRejected: PlainDescriptor<undefined>;
        /**
         * The code blob supplied is larger than [`limits::code::BLOB_BYTES`].
         */
        BlobTooLarge: PlainDescriptor<undefined>;
        /**
         * The static memory consumption of the blob will be larger than
         * [`limits::code::STATIC_MEMORY_BYTES`].
         */
        StaticMemoryTooLarge: PlainDescriptor<undefined>;
        /**
         * The program contains a basic block that is larger than allowed.
         */
        BasicBlockTooLarge: PlainDescriptor<undefined>;
        /**
         * The program contains an invalid instruction.
         */
        InvalidInstruction: PlainDescriptor<undefined>;
        /**
         * The contract has reached its maximum number of delegate dependencies.
         */
        MaxDelegateDependenciesReached: PlainDescriptor<undefined>;
        /**
         * The dependency was not found in the contract's delegate dependencies.
         */
        DelegateDependencyNotFound: PlainDescriptor<undefined>;
        /**
         * The contract already depends on the given delegate dependency.
         */
        DelegateDependencyAlreadyExists: PlainDescriptor<undefined>;
        /**
         * Can not add a delegate dependency to the code hash of the contract itself.
         */
        CannotAddSelfAsDelegateDependency: PlainDescriptor<undefined>;
        /**
         * Can not add more data to transient storage.
         */
        OutOfTransientStorage: PlainDescriptor<undefined>;
        /**
         * The contract tried to call a syscall which does not exist (at its current api level).
         */
        InvalidSyscall: PlainDescriptor<undefined>;
        /**
         * Invalid storage flags were passed to one of the storage syscalls.
         */
        InvalidStorageFlags: PlainDescriptor<undefined>;
        /**
         * PolkaVM failed during code execution. Probably due to a malformed program.
         */
        ExecutionFailed: PlainDescriptor<undefined>;
        /**
         * Failed to convert a U256 to a Balance.
         */
        BalanceConversionFailed: PlainDescriptor<undefined>;
        /**
         * Failed to convert an EVM balance to a native balance.
         */
        DecimalPrecisionLoss: PlainDescriptor<undefined>;
        /**
         * Immutable data can only be set during deploys and only be read during calls.
         * Additionally, it is only valid to set the data once and it must not be empty.
         */
        InvalidImmutableAccess: PlainDescriptor<undefined>;
        /**
         * An `AccountID32` account tried to interact with the pallet without having a mapping.
         *
         * Call [`Pallet::map_account`] in order to create a mapping for the account.
         */
        AccountUnmapped: PlainDescriptor<undefined>;
        /**
         * Tried to map an account that is already mapped.
         */
        AccountAlreadyMapped: PlainDescriptor<undefined>;
        /**
         * The transaction used to dry-run a contract is invalid.
         */
        InvalidGenericTransaction: PlainDescriptor<undefined>;
        /**
         * The refcount of a code either over or underflowed.
         */
        RefcountOverOrUnderflow: PlainDescriptor<undefined>;
        /**
         * Unsupported precompile address
         */
        UnsupportedPrecompileAddress: PlainDescriptor<undefined>;
        /**
         * Precompile Error
         */
        PrecompileFailure: PlainDescriptor<undefined>;
    };
    Messaging: {
        /**
        
         */
        DispatchFailed: PlainDescriptor<undefined>;
        /**
        
         */
        InvalidMessage: PlainDescriptor<undefined>;
        /**
        
         */
        InvalidQuery: PlainDescriptor<undefined>;
        /**
        
         */
        OriginConversionFailed: PlainDescriptor<undefined>;
        /**
        
         */
        MessageExists: PlainDescriptor<undefined>;
        /**
        
         */
        RequestPending: PlainDescriptor<undefined>;
    };
};
type IConstants = {
    System: {
        /**
         * Block & extrinsics weights: base values and limits.
         */
        BlockWeights: PlainDescriptor<Anonymize<In7a38730s6qs>>;
        /**
         * The maximum length of a block (in bytes).
         */
        BlockLength: PlainDescriptor<Anonymize<If15el53dd76v9>>;
        /**
         * Maximum number of block number to block hash mappings to keep (oldest pruned first).
         */
        BlockHashCount: PlainDescriptor<number>;
        /**
         * The weight of runtime database operations the runtime can invoke.
         */
        DbWeight: PlainDescriptor<Anonymize<I9s0ave7t0vnrk>>;
        /**
         * Get the chain's in-code version.
         */
        Version: PlainDescriptor<Anonymize<I4fo08joqmcqnm>>;
        /**
         * The designated SS58 prefix of this chain.
         *
         * This replaces the "ss58Format" property declared in the chain spec. Reason is
         * that the runtime should know about the prefix in order to make use of it as
         * an identifier of the chain.
         */
        SS58Prefix: PlainDescriptor<number>;
    };
    ParachainSystem: {
        /**
         * Returns the parachain ID we are running with.
         */
        SelfParaId: PlainDescriptor<number>;
    };
    Timestamp: {
        /**
         * The minimum period between blocks.
         *
         * Be aware that this is different to the *expected* period that the block production
         * apparatus provides. Your chosen consensus system will generally work with this to
         * determine a sensible block time. For example, in the Aura pallet it will be double this
         * period on default settings.
         */
        MinimumPeriod: PlainDescriptor<bigint>;
    };
    MultiBlockMigrations: {
        /**
         * The maximal length of an encoded cursor.
         *
         * A good default needs to selected such that no migration will ever have a cursor with MEL
         * above this limit. This is statically checked in `integrity_test`.
         */
        CursorMaxLen: PlainDescriptor<number>;
        /**
         * The maximal length of an encoded identifier.
         *
         * A good default needs to selected such that no migration will ever have an identifier
         * with MEL above this limit. This is statically checked in `integrity_test`.
         */
        IdentifierMaxLen: PlainDescriptor<number>;
    };
    Balances: {
        /**
         * The minimum amount required to keep an account open. MUST BE GREATER THAN ZERO!
         *
         * If you *really* need it to be zero, you can enable the feature `insecure_zero_ed` for
         * this pallet. However, you do so at your own risk: this will open up a major DoS vector.
         * In case you have multiple sources of provider references, you may also get unexpected
         * behaviour if you set this to zero.
         *
         * Bottom line: Do yourself a favour and make it at least one!
         */
        ExistentialDeposit: PlainDescriptor<bigint>;
        /**
         * The maximum number of locks that should exist on an account.
         * Not strictly enforced, but used for weight estimation.
         *
         * Use of locks is deprecated in favour of freezes. See `https://github.com/paritytech/substrate/pull/12951/`
         */
        MaxLocks: PlainDescriptor<number>;
        /**
         * The maximum number of named reserves that can exist on an account.
         *
         * Use of reserves is deprecated in favour of holds. See `https://github.com/paritytech/substrate/pull/12951/`
         */
        MaxReserves: PlainDescriptor<number>;
        /**
         * The maximum number of individual freeze locks that can exist on an account at any time.
         */
        MaxFreezes: PlainDescriptor<number>;
    };
    TransactionPayment: {
        /**
         * A fee multiplier for `Operational` extrinsics to compute "virtual tip" to boost their
         * `priority`
         *
         * This value is multiplied by the `final_fee` to obtain a "virtual tip" that is later
         * added to a tip component in regular `priority` calculations.
         * It means that a `Normal` transaction can front-run a similarly-sized `Operational`
         * extrinsic (with no tip), by including a tip value greater than the virtual tip.
         *
         * ```rust,ignore
         * // For `Normal`
         * let priority = priority_calc(tip);
         *
         * // For `Operational`
         * let virtual_tip = (inclusion_fee + tip) * OperationalFeeMultiplier;
         * let priority = priority_calc(tip + virtual_tip);
         * ```
         *
         * Note that since we use `final_fee` the multiplier applies also to the regular `tip`
         * sent with the transaction. So, not only does the transaction get a priority bump based
         * on the `inclusion_fee`, but we also amplify the impact of tips applied to `Operational`
         * transactions.
         */
        OperationalFeeMultiplier: PlainDescriptor<number>;
    };
    Treasury: {
        /**
         * Period between successive spends.
         */
        SpendPeriod: PlainDescriptor<number>;
        /**
         * Percentage of spare funds (if any) that are burnt per spend period.
         */
        Burn: PlainDescriptor<number>;
        /**
         * The treasury's pallet id, used for deriving its sovereign account ID.
         */
        PalletId: PlainDescriptor<FixedSizeBinary<8>>;
        /**
         * DEPRECATED: associated with `spend_local` call and will be removed in May 2025.
         * Refer to <https://github.com/paritytech/polkadot-sdk/pull/5961> for migration to `spend`.
         *
         * The maximum number of approvals that can wait in the spending queue.
         *
         * NOTE: This parameter is also used within the Bounties Pallet extension if enabled.
         */
        MaxApprovals: PlainDescriptor<number>;
        /**
         * The period during which an approved treasury spend has to be claimed.
         */
        PayoutPeriod: PlainDescriptor<number>;
        /**
         * Gets this pallet's derived pot account.
         */
        pot_account: PlainDescriptor<SS58String>;
    };
    Council: {
        /**
         * The maximum weight of a dispatch call that can be proposed and executed.
         */
        MaxProposalWeight: PlainDescriptor<Anonymize<I4q39t5hn830vp>>;
    };
    CollatorSelection: {
        /**
         * Account Identifier from which the internal Pot is generated.
         */
        PotId: PlainDescriptor<FixedSizeBinary<8>>;
        /**
         * Maximum number of candidates that we should have.
         *
         * This does not take into account the invulnerables.
         */
        MaxCandidates: PlainDescriptor<number>;
        /**
         * Minimum number eligible collators. Should always be greater than zero. This includes
         * Invulnerable collators. This ensures that there will always be one collator who can
         * produce a block.
         */
        MinEligibleCollators: PlainDescriptor<number>;
        /**
         * Maximum number of invulnerables.
         */
        MaxInvulnerables: PlainDescriptor<number>;
        /**
        
         */
        KickThreshold: PlainDescriptor<number>;
        /**
         * Gets this pallet's derived pot account.
         */
        pot_account: PlainDescriptor<SS58String>;
    };
    Aura: {
        /**
         * The slot duration Aura should run with, expressed in milliseconds.
         * The effective value of this type should not change while the chain is running.
         *
         * For backwards compatibility either use [`MinimumPeriodTimesTwo`] or a const.
         */
        SlotDuration: PlainDescriptor<bigint>;
    };
    Scheduler: {
        /**
         * The maximum weight that may be scheduled per block for any dispatchables.
         */
        MaximumWeight: PlainDescriptor<Anonymize<I4q39t5hn830vp>>;
        /**
         * The maximum number of scheduled calls in the queue for a single block.
         *
         * NOTE:
         * + Dependent pallets' benchmarks might require a higher limit for the setting. Set a
         * higher limit under `runtime-benchmarks` feature.
         */
        MaxScheduledPerBlock: PlainDescriptor<number>;
    };
    XcmpQueue: {
        /**
         * The maximum number of inbound XCMP channels that can be suspended simultaneously.
         *
         * Any further channel suspensions will fail and messages may get dropped without further
         * notice. Choosing a high value (1000) is okay; the trade-off that is described in
         * [`InboundXcmpSuspended`] still applies at that scale.
         */
        MaxInboundSuspended: PlainDescriptor<number>;
        /**
         * Maximal number of outbound XCMP channels that can have messages queued at the same time.
         *
         * If this is reached, then no further messages can be sent to channels that do not yet
         * have a message queued. This should be set to the expected maximum of outbound channels
         * which is determined by [`Self::ChannelInfo`]. It is important to set this large enough,
         * since otherwise the congestion control protocol will not work as intended and messages
         * may be dropped. This value increases the PoV and should therefore not be picked too
         * high. Governance needs to pay attention to not open more channels than this value.
         */
        MaxActiveOutboundChannels: PlainDescriptor<number>;
        /**
         * The maximal page size for HRMP message pages.
         *
         * A lower limit can be set dynamically, but this is the hard-limit for the PoV worst case
         * benchmarking. The limit for the size of a message is slightly below this, since some
         * overhead is incurred for encoding the format.
         */
        MaxPageSize: PlainDescriptor<number>;
    };
    MessageQueue: {
        /**
         * The size of the page; this implies the maximum message size which can be sent.
         *
         * A good value depends on the expected message sizes, their weights, the weight that is
         * available for processing them and the maximal needed message size. The maximal message
         * size is slightly lower than this as defined by [`MaxMessageLenOf`].
         */
        HeapSize: PlainDescriptor<number>;
        /**
         * The maximum number of stale pages (i.e. of overweight messages) allowed before culling
         * can happen. Once there are more stale pages than this, then historical pages may be
         * dropped, even if they contain unprocessed overweight messages.
         */
        MaxStale: PlainDescriptor<number>;
        /**
         * The amount of weight (if any) which should be provided to the message queue for
         * servicing enqueued items `on_initialize`.
         *
         * This may be legitimately `None` in the case that you will call
         * `ServiceQueues::service_queues` manually or set [`Self::IdleMaxServiceWeight`] to have
         * it run in `on_idle`.
         */
        ServiceWeight: PlainDescriptor<Anonymize<Iasb8k6ash5mjn>>;
        /**
         * The maximum amount of weight (if any) to be used from remaining weight `on_idle` which
         * should be provided to the message queue for servicing enqueued items `on_idle`.
         * Useful for parachains to process messages at the same block they are received.
         *
         * If `None`, it will not call `ServiceQueues::service_queues` in `on_idle`.
         */
        IdleMaxServiceWeight: PlainDescriptor<Anonymize<Iasb8k6ash5mjn>>;
    };
    Contracts: {
        /**
         * Cost schedule and limits.
         */
        Schedule: PlainDescriptor<Anonymize<Ijc5n210o8bbf>>;
        /**
         * The amount of balance a caller has to pay for each byte of storage.
         *
         * # Note
         *
         * Changing this value for an existing chain might need a storage migration.
         */
        DepositPerByte: PlainDescriptor<bigint>;
        /**
         * Fallback value to limit the storage deposit if it's not being set by the caller.
         */
        DefaultDepositLimit: PlainDescriptor<bigint>;
        /**
         * The amount of balance a caller has to pay for each storage item.
         *
         * # Note
         *
         * Changing this value for an existing chain might need a storage migration.
         */
        DepositPerItem: PlainDescriptor<bigint>;
        /**
         * The percentage of the storage deposit that should be held for using a code hash.
         * Instantiating a contract, or calling [`chain_extension::Ext::lock_delegate_dependency`]
         * protects the code from being removed. In order to prevent abuse these actions are
         * protected with a percentage of the code deposit.
         */
        CodeHashLockupDepositPercent: PlainDescriptor<number>;
        /**
         * The maximum length of a contract code in bytes.
         *
         * The value should be chosen carefully taking into the account the overall memory limit
         * your runtime has, as well as the [maximum allowed callstack
         * depth](#associatedtype.CallStack). Look into the `integrity_test()` for some insights.
         */
        MaxCodeLen: PlainDescriptor<number>;
        /**
         * The maximum allowable length in bytes for storage keys.
         */
        MaxStorageKeyLen: PlainDescriptor<number>;
        /**
         * The maximum size of the transient storage in bytes.
         * This includes keys, values, and previous entries used for storage rollback.
         */
        MaxTransientStorageSize: PlainDescriptor<number>;
        /**
         * The maximum number of delegate_dependencies that a contract can lock with
         * [`chain_extension::Ext::lock_delegate_dependency`].
         */
        MaxDelegateDependencies: PlainDescriptor<number>;
        /**
         * Make contract callable functions marked as `#[unstable]` available.
         *
         * Contracts that use `#[unstable]` functions won't be able to be uploaded unless
         * this is set to `true`. This is only meant for testnets and dev nodes in order to
         * experiment with new features.
         *
         * # Warning
         *
         * Do **not** set to `true` on productions chains.
         */
        UnsafeUnstableInterface: PlainDescriptor<boolean>;
        /**
         * The maximum length of the debug buffer in bytes.
         */
        MaxDebugBufferLen: PlainDescriptor<number>;
        /**
         * Type that bundles together all the runtime configurable interface types.
         *
         * This is not a real config. We just mention the type here as constant so that
         * its type appears in the metadata. Only valid value is `()`.
         */
        Environment: PlainDescriptor<Anonymize<I3m5sq54sjdlso>>;
        /**
         * The version of the HostFn APIs that are available in the runtime.
         *
         * Only valid value is `()`.
         */
        ApiVersion: PlainDescriptor<number>;
    };
    Proxy: {
        /**
         * The base amount of currency needed to reserve for creating a proxy.
         *
         * This is held for an additional storage item whose value size is
         * `sizeof(Balance)` bytes and whose key size is `sizeof(AccountId)` bytes.
         */
        ProxyDepositBase: PlainDescriptor<bigint>;
        /**
         * The amount of currency needed per proxy added.
         *
         * This is held for adding 32 bytes plus an instance of `ProxyType` more into a
         * pre-existing storage value. Thus, when configuring `ProxyDepositFactor` one should take
         * into account `32 + proxy_type.encode().len()` bytes of data.
         */
        ProxyDepositFactor: PlainDescriptor<bigint>;
        /**
         * The maximum amount of proxies allowed for a single account.
         */
        MaxProxies: PlainDescriptor<number>;
        /**
         * The maximum amount of time-delayed announcements that are allowed to be pending.
         */
        MaxPending: PlainDescriptor<number>;
        /**
         * The base amount of currency needed to reserve for creating an announcement.
         *
         * This is held when a new storage item holding a `Balance` is created (typically 16
         * bytes).
         */
        AnnouncementDepositBase: PlainDescriptor<bigint>;
        /**
         * The amount of currency needed per announcement made.
         *
         * This is held for adding an `AccountId`, `Hash` and `BlockNumber` (typically 68 bytes)
         * into a pre-existing storage value.
         */
        AnnouncementDepositFactor: PlainDescriptor<bigint>;
    };
    Multisig: {
        /**
         * The base amount of currency needed to reserve for creating a multisig execution or to
         * store a dispatch call for later.
         *
         * This is held for an additional storage item whose value size is
         * `4 + sizeof((BlockNumber, Balance, AccountId))` bytes and whose key size is
         * `32 + sizeof(AccountId)` bytes.
         */
        DepositBase: PlainDescriptor<bigint>;
        /**
         * The amount of currency needed per unit threshold when creating a multisig execution.
         *
         * This is held for adding 32 bytes more into a pre-existing storage value.
         */
        DepositFactor: PlainDescriptor<bigint>;
        /**
         * The maximum amount of signatories allowed in the multisig.
         */
        MaxSignatories: PlainDescriptor<number>;
    };
    Utility: {
        /**
         * The limit on the number of batched calls.
         */
        batched_calls_limit: PlainDescriptor<number>;
    };
    Nfts: {
        /**
         * The basic amount of funds that must be reserved for collection.
         */
        CollectionDeposit: PlainDescriptor<bigint>;
        /**
         * The basic amount of funds that must be reserved for an item.
         */
        ItemDeposit: PlainDescriptor<bigint>;
        /**
         * The basic amount of funds that must be reserved when adding metadata to your item.
         */
        MetadataDepositBase: PlainDescriptor<bigint>;
        /**
         * The basic amount of funds that must be reserved when adding an attribute to an item.
         */
        AttributeDepositBase: PlainDescriptor<bigint>;
        /**
         * The additional funds that must be reserved for the number of bytes store in metadata,
         * either "normal" metadata or attribute metadata.
         */
        DepositPerByte: PlainDescriptor<bigint>;
        /**
         * The maximum length of data stored on-chain.
         */
        StringLimit: PlainDescriptor<number>;
        /**
         * The maximum length of an attribute key.
         */
        KeyLimit: PlainDescriptor<number>;
        /**
         * The maximum length of an attribute value.
         */
        ValueLimit: PlainDescriptor<number>;
        /**
         * The maximum approvals an item could have.
         */
        ApprovalsLimit: PlainDescriptor<number>;
        /**
         * The maximum attributes approvals an item could have.
         */
        ItemAttributesApprovalsLimit: PlainDescriptor<number>;
        /**
         * The max number of tips a user could send.
         */
        MaxTips: PlainDescriptor<number>;
        /**
         * The max duration in blocks for deadlines.
         */
        MaxDeadlineDuration: PlainDescriptor<number>;
        /**
         * The max number of attributes a user could set per call.
         */
        MaxAttributesPerCall: PlainDescriptor<number>;
        /**
         * Disables some of pallet's features.
         */
        Features: PlainDescriptor<bigint>;
    };
    NftFractionalization: {
        /**
         * The deposit paid by the user locking an NFT. The deposit is returned to the original NFT
         * owner when the asset is unified and the NFT is unlocked.
         */
        Deposit: PlainDescriptor<bigint>;
        /**
         * The pallet's id, used for deriving its sovereign account ID.
         */
        PalletId: PlainDescriptor<FixedSizeBinary<8>>;
        /**
         * The newly created asset's symbol.
         */
        NewAssetSymbol: PlainDescriptor<Binary>;
        /**
         * The newly created asset's name.
         */
        NewAssetName: PlainDescriptor<Binary>;
        /**
         * The maximum length of a name or symbol stored on-chain.
         */
        StringLimit: PlainDescriptor<number>;
    };
    Assets: {
        /**
         * Max number of items to destroy per `destroy_accounts` and `destroy_approvals` call.
         *
         * Must be configured to result in a weight that makes each call fit in a block.
         */
        RemoveItemsLimit: PlainDescriptor<number>;
        /**
         * The basic amount of funds that must be reserved for an asset.
         */
        AssetDeposit: PlainDescriptor<bigint>;
        /**
         * The amount of funds that must be reserved for a non-provider asset account to be
         * maintained.
         */
        AssetAccountDeposit: PlainDescriptor<bigint>;
        /**
         * The basic amount of funds that must be reserved when adding metadata to your asset.
         */
        MetadataDepositBase: PlainDescriptor<bigint>;
        /**
         * The additional funds that must be reserved for the number of bytes you store in your
         * metadata.
         */
        MetadataDepositPerByte: PlainDescriptor<bigint>;
        /**
         * The amount of funds that must be reserved when creating a new approval.
         */
        ApprovalDeposit: PlainDescriptor<bigint>;
        /**
         * The maximum length of a name or symbol stored on-chain.
         */
        StringLimit: PlainDescriptor<number>;
    };
    Revive: {
        /**
         * The amount of balance a caller has to pay for each byte of storage.
         *
         * # Note
         *
         * It is safe to change this value on a live chain as all refunds are pro rata.
         */
        DepositPerByte: PlainDescriptor<bigint>;
        /**
         * The amount of balance a caller has to pay for each storage item.
         *
         * # Note
         *
         * It is safe to change this value on a live chain as all refunds are pro rata.
         */
        DepositPerItem: PlainDescriptor<bigint>;
        /**
         * The percentage of the storage deposit that should be held for using a code hash.
         * Instantiating a contract, protects the code from being removed. In order to prevent
         * abuse these actions are protected with a percentage of the code deposit.
         */
        CodeHashLockupDepositPercent: PlainDescriptor<number>;
        /**
         * Make contract callable functions marked as `#[unstable]` available.
         *
         * Contracts that use `#[unstable]` functions won't be able to be uploaded unless
         * this is set to `true`. This is only meant for testnets and dev nodes in order to
         * experiment with new features.
         *
         * # Warning
         *
         * Do **not** set to `true` on productions chains.
         */
        UnsafeUnstableInterface: PlainDescriptor<boolean>;
        /**
         * The [EIP-155](https://eips.ethereum.org/EIPS/eip-155) chain ID.
         *
         * This is a unique identifier assigned to each blockchain network,
         * preventing replay attacks.
         */
        ChainId: PlainDescriptor<bigint>;
        /**
         * The ratio between the decimal representation of the native token and the ETH token.
         */
        NativeToEthRatio: PlainDescriptor<number>;
    };
    Messaging: {
        /**
        
         */
        ByteFee: PlainDescriptor<bigint>;
        /**
        
         */
        IsmpByteFee: PlainDescriptor<bigint>;
        /**
         * The maximum length of any additional application-specific metadata relating to a
         * request.
         */
        MaxContextLen: PlainDescriptor<number>;
        /**
         * The maximum length of outbound (posted) data.
         */
        MaxDataLen: PlainDescriptor<number>;
        /**
        
         */
        MaxKeys: PlainDescriptor<number>;
        /**
        
         */
        MaxKeyLen: PlainDescriptor<number>;
        /**
        
         */
        MaxResponseLen: PlainDescriptor<number>;
        /**
        
         */
        MaxRemovals: PlainDescriptor<number>;
    };
};
type IViewFns = {};
type IRuntimeCalls = {
    /**
     * API necessary for block authorship with aura.
     */
    AuraApi: {
        /**
         * Returns the slot duration for Aura.
         *
         * Currently, only the value provided by this type at genesis will be used.
         */
        slot_duration: RuntimeDescriptor<[], bigint>;
        /**
         * Return the current set of authorities.
         */
        authorities: RuntimeDescriptor<[], Anonymize<Ic5m5lp1oioo8r>>;
    };
    /**
     * The `Core` runtime api that every Substrate runtime needs to implement.
     */
    Core: {
        /**
         * Returns the version of the runtime.
         */
        version: RuntimeDescriptor<[], Anonymize<I4fo08joqmcqnm>>;
        /**
         * Execute the given block.
         */
        execute_block: RuntimeDescriptor<[block: Anonymize<Iaqet9jc3ihboe>], undefined>;
        /**
         * Initialize a block with the given header and return the runtime executive mode.
         */
        initialize_block: RuntimeDescriptor<[header: Anonymize<Ic952bubvq4k7d>], Anonymize<I2v50gu3s1aqk6>>;
    };
    /**
     * The `Metadata` api trait that returns metadata for the runtime.
     */
    Metadata: {
        /**
         * Returns the metadata of a runtime.
         */
        metadata: RuntimeDescriptor<[], Binary>;
        /**
         * Returns the metadata at a given version.
         *
         * If the given `version` isn't supported, this will return `None`.
         * Use [`Self::metadata_versions`] to find out about supported metadata version of the runtime.
         */
        metadata_at_version: RuntimeDescriptor<[version: number], Anonymize<Iabpgqcjikia83>>;
        /**
         * Returns the supported metadata versions.
         *
         * This can be used to call `metadata_at_version`.
         */
        metadata_versions: RuntimeDescriptor<[], Anonymize<Icgljjb6j82uhn>>;
    };
    /**
     * Runtime API for executing view functions
     */
    RuntimeViewFunction: {
        /**
         * Execute a view function query.
         */
        execute_view_function: RuntimeDescriptor<[query_id: Anonymize<I4gil44d08grh>, input: Binary], Anonymize<I7u915mvkdsb08>>;
    };
    /**
     * The `BlockBuilder` api trait that provides the required functionality for building a block.
     */
    BlockBuilder: {
        /**
         * Apply the given extrinsic.
         *
         * Returns an inclusion outcome which specifies if this extrinsic is included in
         * this block or not.
         */
        apply_extrinsic: RuntimeDescriptor<[extrinsic: Binary], Anonymize<Ibuckoe3pl0u61>>;
        /**
         * Finish the current block.
         */
        finalize_block: RuntimeDescriptor<[], Anonymize<Ic952bubvq4k7d>>;
        /**
         * Generate inherent extrinsics. The inherent data will vary from chain to chain.
         */
        inherent_extrinsics: RuntimeDescriptor<[inherent: Anonymize<If7uv525tdvv7a>], Anonymize<Itom7fk49o0c9>>;
        /**
         * Check that the inherents are valid. The inherent data will vary from chain to chain.
         */
        check_inherents: RuntimeDescriptor<[block: Anonymize<Iaqet9jc3ihboe>, data: Anonymize<If7uv525tdvv7a>], Anonymize<I2an1fs2eiebjp>>;
    };
    /**
     * The `TaggedTransactionQueue` api trait for interfering with the transaction queue.
     */
    TaggedTransactionQueue: {
        /**
         * Validate the transaction.
         *
         * This method is invoked by the transaction pool to learn details about given transaction.
         * The implementation should make sure to verify the correctness of the transaction
         * against current state. The given `block_hash` corresponds to the hash of the block
         * that is used as current state.
         *
         * Note that this call may be performed by the pool multiple times and transactions
         * might be verified in any possible order.
         */
        validate_transaction: RuntimeDescriptor<[source: TransactionValidityTransactionSource, tx: Binary, block_hash: FixedSizeBinary<32>], Anonymize<I9ask1o4tfvcvs>>;
    };
    /**
     * The offchain worker api.
     */
    OffchainWorkerApi: {
        /**
         * Starts the off-chain task for given block header.
         */
        offchain_worker: RuntimeDescriptor<[header: Anonymize<Ic952bubvq4k7d>], undefined>;
    };
    /**
     * Session keys runtime api.
     */
    SessionKeys: {
        /**
         * Generate a set of session keys with optionally using the given seed.
         * The keys should be stored within the keystore exposed via runtime
         * externalities.
         *
         * The seed needs to be a valid `utf8` string.
         *
         * Returns the concatenated SCALE encoded public keys.
         */
        generate_session_keys: RuntimeDescriptor<[seed: Anonymize<Iabpgqcjikia83>], Binary>;
        /**
         * Decode the given public session keys.
         *
         * Returns the list of public raw public keys + key type.
         */
        decode_session_keys: RuntimeDescriptor<[encoded: Binary], Anonymize<Icerf8h8pdu8ss>>;
    };
    /**
     * The API to query account nonce.
     */
    AccountNonceApi: {
        /**
         * Get current account nonce of given `AccountId`.
         */
        account_nonce: RuntimeDescriptor<[account: SS58String], number>;
    };
    /**
    
     */
    TransactionPaymentApi: {
        /**
        
         */
        query_info: RuntimeDescriptor<[uxt: Binary, len: number], Anonymize<I6spmpef2c7svf>>;
        /**
        
         */
        query_fee_details: RuntimeDescriptor<[uxt: Binary, len: number], Anonymize<Iei2mvq0mjvt81>>;
        /**
        
         */
        query_weight_to_fee: RuntimeDescriptor<[weight: Anonymize<I4q39t5hn830vp>], bigint>;
        /**
        
         */
        query_length_to_fee: RuntimeDescriptor<[length: number], bigint>;
    };
    /**
    
     */
    TransactionPaymentCallApi: {
        /**
         * Query information of a dispatch class, weight, and fee of a given encoded `Call`.
         */
        query_call_info: RuntimeDescriptor<[call: Anonymize<I76dvde06adda>, len: number], Anonymize<I6spmpef2c7svf>>;
        /**
         * Query fee details of a given encoded `Call`.
         */
        query_call_fee_details: RuntimeDescriptor<[call: Anonymize<I76dvde06adda>, len: number], Anonymize<Iei2mvq0mjvt81>>;
        /**
         * Query the output of the current `WeightToFee` given some input.
         */
        query_weight_to_fee: RuntimeDescriptor<[weight: Anonymize<I4q39t5hn830vp>], bigint>;
        /**
         * Query the output of the current `LengthToFee` given some input.
         */
        query_length_to_fee: RuntimeDescriptor<[length: number], bigint>;
    };
    /**
     * The API used to dry-run contract interactions.
     */
    ContractsApi: {
        /**
         * Perform a call from a specified account to a given contract.
         *
         * See [`crate::Pallet::bare_call`].
         */
        call: RuntimeDescriptor<[origin: SS58String, dest: SS58String, value: bigint, gas_limit: Anonymize<Iasb8k6ash5mjn>, storage_deposit_limit: Anonymize<I35p85j063s0il>, input_data: Binary], Anonymize<I5nl58rn9l3igg>>;
        /**
         * Instantiate a new contract.
         *
         * See `[crate::Pallet::bare_instantiate]`.
         */
        instantiate: RuntimeDescriptor<[origin: SS58String, value: bigint, gas_limit: Anonymize<Iasb8k6ash5mjn>, storage_deposit_limit: Anonymize<I35p85j063s0il>, code: Anonymize<I9sijb8gfrns29>, data: Binary, salt: Binary], Anonymize<Ifkjghks8m24kq>>;
        /**
         * Upload new code without instantiating a contract from it.
         *
         * See [`crate::Pallet::bare_upload_code`].
         */
        upload_code: RuntimeDescriptor<[origin: SS58String, code: Binary, storage_deposit_limit: Anonymize<I35p85j063s0il>, determinism: Anonymize<I2dfliekq1ed7e>], Anonymize<I6sua9tbs1tvlp>>;
        /**
         * Query a given storage key in a given contract.
         *
         * Returns `Ok(Some(Vec<u8>))` if the storage value exists under the given key in the
         * specified account and `Ok(None)` if it doesn't. If the account specified by the address
         * doesn't exist, or doesn't have a contract then `Err` is returned.
         */
        get_storage: RuntimeDescriptor<[address: SS58String, key: Binary], Anonymize<I9u22scd4ksrjm>>;
    };
    /**
     * This runtime API is used to inform potential block authors whether they will
     * have the right to author at a slot, assuming they have claimed the slot.
     *
     * In particular, this API allows Aura-based parachains to regulate their "unincluded segment",
     * which is the section of the head of the chain which has not yet been made available in the
     * relay chain.
     *
     * When the unincluded segment is short, Aura chains will allow authors to create multiple
     * blocks per slot in order to build a backlog. When it is saturated, this API will limit
     * the amount of blocks that can be created.
     *
     * Changes:
     * - Version 2: Update to `can_build_upon` to take a relay chain `Slot` instead of a parachain `Slot`.
     */
    AuraUnincludedSegmentApi: {
        /**
         * Whether it is legal to extend the chain, assuming the given block is the most
         * recently included one as-of the relay parent that will be built against, and
         * the given relay chain slot.
         *
         * This should be consistent with the logic the runtime uses when validating blocks to
         * avoid issues.
         *
         * When the unincluded segment is empty, i.e. `included_hash == at`, where at is the block
         * whose state we are querying against, this must always return `true` as long as the slot
         * is more recent than the included block itself.
         */
        can_build_upon: RuntimeDescriptor<[included_hash: FixedSizeBinary<32>, slot: bigint], boolean>;
    };
    /**
     * Runtime api to collect information about a collation.
     */
    CollectCollationInfo: {
        /**
         * Collect information about a collation.
         *
         * The given `header` is the header of the built block for that
         * we are collecting the collation info for.
         */
        collect_collation_info: RuntimeDescriptor<[header: Anonymize<Ic952bubvq4k7d>], Anonymize<Ic1d4u2opv3fst>>;
    };
    /**
    
     */
    NftsApi: {
        /**
        
         */
        owner: RuntimeDescriptor<[collection: number, item: number], Anonymize<Ihfphjolmsqq1>>;
        /**
        
         */
        collection_owner: RuntimeDescriptor<[collection: number], Anonymize<Ihfphjolmsqq1>>;
        /**
        
         */
        attribute: RuntimeDescriptor<[collection: number, item: number, key: Binary], Anonymize<Iabpgqcjikia83>>;
        /**
        
         */
        custom_attribute: RuntimeDescriptor<[account: SS58String, collection: number, item: number, key: Binary], Anonymize<Iabpgqcjikia83>>;
        /**
        
         */
        system_attribute: RuntimeDescriptor<[collection: number, item: Anonymize<I4arjljr6dpflb>, key: Binary], Anonymize<Iabpgqcjikia83>>;
        /**
        
         */
        collection_attribute: RuntimeDescriptor<[collection: number, key: Binary], Anonymize<Iabpgqcjikia83>>;
    };
    /**
     * The API used to dry-run contract interactions.
     */
    ReviveApi: {
        /**
         * Returns the block gas limit.
         */
        block_gas_limit: RuntimeDescriptor<[], Anonymize<I4totqt881mlti>>;
        /**
         * Returns the free balance of the given `[H160]` address, using EVM decimals.
         */
        balance: RuntimeDescriptor<[address: FixedSizeBinary<20>], Anonymize<I4totqt881mlti>>;
        /**
         * Returns the gas price.
         */
        gas_price: RuntimeDescriptor<[], Anonymize<I4totqt881mlti>>;
        /**
         * Returns the nonce of the given `[H160]` address.
         */
        nonce: RuntimeDescriptor<[address: FixedSizeBinary<20>], number>;
        /**
         * Perform a call from a specified account to a given contract.
         *
         * See [`crate::Pallet::bare_call`].
         */
        call: RuntimeDescriptor<[origin: SS58String, dest: FixedSizeBinary<20>, value: bigint, gas_limit: Anonymize<Iasb8k6ash5mjn>, storage_deposit_limit: Anonymize<I35p85j063s0il>, input_data: Binary], Anonymize<I8gfbtjjcfvqul>>;
        /**
         * Instantiate a new contract.
         *
         * See `[crate::Pallet::bare_instantiate]`.
         */
        instantiate: RuntimeDescriptor<[origin: SS58String, value: bigint, gas_limit: Anonymize<Iasb8k6ash5mjn>, storage_deposit_limit: Anonymize<I35p85j063s0il>, code: Anonymize<I9sijb8gfrns29>, data: Binary, salt: Anonymize<I4s6vifaf8k998>], Anonymize<I379a3mumkfm4u>>;
        /**
         * Perform an Ethereum call.
         *
         * See [`crate::Pallet::bare_eth_transact`]
         */
        eth_transact: RuntimeDescriptor<[tx: Anonymize<Ie2utffa038qbn>], Anonymize<I8abab09ak4pi1>>;
        /**
         * Upload new code without instantiating a contract from it.
         *
         * See [`crate::Pallet::bare_upload_code`].
         */
        upload_code: RuntimeDescriptor<[origin: SS58String, code: Binary, storage_deposit_limit: Anonymize<I35p85j063s0il>], Anonymize<I6sua9tbs1tvlp>>;
        /**
         * Query a given storage key in a given contract.
         *
         * Returns `Ok(Some(Vec<u8>))` if the storage value exists under the given key in the
         * specified account and `Ok(None)` if it doesn't. If the account specified by the address
         * doesn't exist, or doesn't have a contract then `Err` is returned.
         */
        get_storage: RuntimeDescriptor<[address: FixedSizeBinary<20>, key: FixedSizeBinary<32>], Anonymize<Iehnkjehe1oeva>>;
        /**
         * Traces the execution of an entire block and returns call traces.
         *
         * This is intended to be called through `state_call` to replay the block from the
         * parent block.
         *
         * See eth-rpc `debug_traceBlockByNumber` for usage.
         */
        trace_block: RuntimeDescriptor<[block: Anonymize<Iaqet9jc3ihboe>, config: Anonymize<Ifbmd9e2argcmg>], Anonymize<I2bl5e7he0kaq9>>;
        /**
         * Traces the execution of a specific transaction within a block.
         *
         * This is intended to be called through `state_call` to replay the block from the
         * parent hash up to the transaction.
         *
         * See eth-rpc `debug_traceTransaction` for usage.
         */
        trace_tx: RuntimeDescriptor<[block: Anonymize<Iaqet9jc3ihboe>, tx_index: number, config: Anonymize<Ifbmd9e2argcmg>], Anonymize<I2d63hfvrckrkc>>;
        /**
         * Dry run and return the trace of the given call.
         *
         * See eth-rpc `debug_traceCall` for usage.
         */
        trace_call: RuntimeDescriptor<[tx: Anonymize<Ie2utffa038qbn>, config: Anonymize<Ifbmd9e2argcmg>], Anonymize<Ibabtpgk9h20k6>>;
    };
    /**
     * Required runtime APIs needed for client subsystems like the RPC
     */
    IsmpRuntimeApi: {
        /**
         * Should return the host's state machine identifier
         */
        host_state_machine: RuntimeDescriptor<[], Anonymize<I25ubidgt5kbu2>>;
        /**
         * Generate a proof for the provided leaf indices
         */
        generate_proof: RuntimeDescriptor<[commitments: Anonymize<I88s970jldn57s>], Anonymize<Ia1fc83d1vmh2g>>;
        /**
         * Fetch all ISMP events
         */
        block_events: RuntimeDescriptor<[], Anonymize<I52u39k9vlndt2>>;
        /**
         * Fetch all ISMP events and their extrinsic metadata
         */
        block_events_with_metadata: RuntimeDescriptor<[], Anonymize<I6opi5c2k8qt6q>>;
        /**
         * Return the scale encoded consensus state
         */
        consensus_state: RuntimeDescriptor<[id: FixedSizeBinary<4>], Anonymize<Iabpgqcjikia83>>;
        /**
         * Return the timestamp this client was last updated in seconds
         */
        state_machine_update_time: RuntimeDescriptor<[id: Anonymize<I7jr7fpe101ton>], Anonymize<I35p85j063s0il>>;
        /**
         * Return the challenge period timestamp
         */
        challenge_period: RuntimeDescriptor<[id: Anonymize<I58bf8c7kp5i84>], Anonymize<I35p85j063s0il>>;
        /**
         * Return the latest height of the state machine
         */
        latest_state_machine_height: RuntimeDescriptor<[id: Anonymize<I58bf8c7kp5i84>], Anonymize<I35p85j063s0il>>;
        /**
         * Fetch the requests for the given commitments.
         */
        requests: RuntimeDescriptor<[request_commitments: Anonymize<Ic5m5lp1oioo8r>], Anonymize<Ianhcjhlrgugp>>;
        /**
         * Fetch the responses for the given commitments.
         */
        responses: RuntimeDescriptor<[response_commitments: Anonymize<Ic5m5lp1oioo8r>], Anonymize<I5s9j68kl4u3ek>>;
    };
    /**
     * Ismp Parachain consensus client runtime APIs
     */
    IsmpParachainApi: {
        /**
         * Return all the para_ids this runtime is interested in. Used by the inherent provider
         */
        para_ids: RuntimeDescriptor<[], Anonymize<Icgljjb6j82uhn>>;
        /**
         * Return the current relay chain state.
         */
        current_relay_chain_state: RuntimeDescriptor<[], Anonymize<I67smi4kj2jg4u>>;
    };
    /**
     * API for querying trusted reserves and trusted teleporters.
     */
    TrustedQueryApi: {
        /**
         * Returns if the location is a trusted reserve for the asset.
         *
         * # Arguments
         * * `asset`: `VersionedAsset`.
         * * `location`: `VersionedLocation`.
         */
        is_trusted_reserve: RuntimeDescriptor<[asset: XcmVersionedAsset, location: XcmVersionedLocation], Anonymize<Icujp6hmv35vbn>>;
        /**
         * Returns if the asset can be teleported to the location.
         *
         * # Arguments
         * * `asset`: `VersionedAsset`.
         * * `location`: `VersionedLocation`.
         */
        is_trusted_teleporter: RuntimeDescriptor<[asset: XcmVersionedAsset, location: XcmVersionedLocation], Anonymize<Icujp6hmv35vbn>>;
    };
    /**
     * API for querying XCM authorized aliases
     */
    AuthorizedAliasersApi: {
        /**
         * Returns locations allowed to alias into and act as `target`.
         */
        authorized_aliasers: RuntimeDescriptor<[target: XcmVersionedLocation], Anonymize<I4tjame31218k9>>;
        /**
         * Returns whether `origin` is allowed to alias into and act as `target`.
         */
        is_authorized_alias: RuntimeDescriptor<[origin: XcmVersionedLocation, target: XcmVersionedLocation], Anonymize<I5gif8vomct5i8>>;
    };
    /**
     * API to interact with `RuntimeGenesisConfig` for the runtime
     */
    GenesisBuilder: {
        /**
         * Build `RuntimeGenesisConfig` from a JSON blob not using any defaults and store it in the
         * storage.
         *
         * In the case of a FRAME-based runtime, this function deserializes the full
         * `RuntimeGenesisConfig` from the given JSON blob and puts it into the storage. If the
         * provided JSON blob is incorrect or incomplete or the deserialization fails, an error
         * is returned.
         *
         * Please note that provided JSON blob must contain all `RuntimeGenesisConfig` fields, no
         * defaults will be used.
         */
        build_state: RuntimeDescriptor<[json: Binary], Anonymize<Ie9sr1iqcg3cgm>>;
        /**
         * Returns a JSON blob representation of the built-in `RuntimeGenesisConfig` identified by
         * `id`.
         *
         * If `id` is `None` the function should return JSON blob representation of the default
         * `RuntimeGenesisConfig` struct of the runtime. Implementation must provide default
         * `RuntimeGenesisConfig`.
         *
         * Otherwise function returns a JSON representation of the built-in, named
         * `RuntimeGenesisConfig` preset identified by `id`, or `None` if such preset does not
         * exist. Returned `Vec<u8>` contains bytes of JSON blob (patch) which comprises a list of
         * (potentially nested) key-value pairs that are intended for customizing the default
         * runtime genesis config. The patch shall be merged (rfc7386) with the JSON representation
         * of the default `RuntimeGenesisConfig` to create a comprehensive genesis config that can
         * be used in `build_state` method.
         */
        get_preset: RuntimeDescriptor<[id: Anonymize<I1mqgk2tmnn9i2>], Anonymize<Iabpgqcjikia83>>;
        /**
         * Returns a list of identifiers for available builtin `RuntimeGenesisConfig` presets.
         *
         * The presets from the list can be queried with [`GenesisBuilder::get_preset`] method. If
         * no named presets are provided by the runtime the list is empty.
         */
        preset_names: RuntimeDescriptor<[], Anonymize<I6lr8sctk0bi4e>>;
    };
};
type IAsset = PlainDescriptor<void>;
export type PopDispatchError = Anonymize<I8id3dvc1gaj6d>;
type PalletsTypedef = {
    __storage: IStorage;
    __tx: ICalls;
    __event: IEvent;
    __error: IError;
    __const: IConstants;
    __view: IViewFns;
};
export type Pop = {
    descriptors: {
        pallets: PalletsTypedef;
        apis: IRuntimeCalls;
    } & Promise<any>;
    metadataTypes: Promise<Uint8Array>;
    asset: IAsset;
    getMetadata: () => Promise<Uint8Array>;
    genesis: string | undefined;
};
declare const _allDescriptors: Pop;
export default _allDescriptors;
export type PopApis = ApisFromDef<IRuntimeCalls>;
export type PopQueries = QueryFromPalletsDef<PalletsTypedef>;
export type PopCalls = TxFromPalletsDef<PalletsTypedef>;
export type PopEvents = EventsFromPalletsDef<PalletsTypedef>;
export type PopErrors = ErrorsFromPalletsDef<PalletsTypedef>;
export type PopConstants = ConstFromPalletsDef<PalletsTypedef>;
export type PopViewFns = ViewFnsFromPalletsDef<PalletsTypedef>;
export type PopCallData = Anonymize<I76dvde06adda> & {
    value: {
        type: string;
    };
};
export type PopWhitelistEntry = PalletKey | ApiKey<IRuntimeCalls> | `query.${NestedKey<PalletsTypedef['__storage']>}` | `tx.${NestedKey<PalletsTypedef['__tx']>}` | `event.${NestedKey<PalletsTypedef['__event']>}` | `error.${NestedKey<PalletsTypedef['__error']>}` | `const.${NestedKey<PalletsTypedef['__const']>}` | `view.${NestedKey<PalletsTypedef['__view']>}`;
type PalletKey = `*.${keyof (IStorage & ICalls & IEvent & IError & IConstants & IRuntimeCalls & IViewFns)}`;
type NestedKey<D extends Record<string, Record<string, any>>> = "*" | {
    [P in keyof D & string]: `${P}.*` | {
        [N in keyof D[P] & string]: `${P}.${N}`;
    }[keyof D[P] & string];
}[keyof D & string];
type ApiKey<D extends Record<string, Record<string, any>>> = "api.*" | {
    [P in keyof D & string]: `api.${P}.*` | {
        [N in keyof D[P] & string]: `api.${P}.${N}`;
    }[keyof D[P] & string];
}[keyof D & string];
